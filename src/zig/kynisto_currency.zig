// ==============================================================================
// ⚡ Kynisto Zig Core Engine: Lossless Fixed-Point Currency & GST Ledger
// Saturating 64-bit integer arithmetic (paise/micro-units) eliminating
// IEEE 754 floating-point drift across Indian GST invoices and wallet balances.
// ==============================================================================

const std = @import("std");

pub const CurrencyError = error{
    Overflow,
    DivisionByZero,
    NegativeAmount,
};

/// 64-bit fixed-point integer currency unit: 1 INR = 100 Paise
pub const FixedPointCurrency = struct {
    paise: i64,

    pub fn from_rupees(rupees: f64) FixedPointCurrency {
        const p: i64 = @intFromFloat(std.math.round(rupees * 100.0));
        return FixedPointCurrency{ .paise = p };
    }

    pub fn to_rupees(self: FixedPointCurrency) f64 {
        return @as(f64, @floatFromInt(self.paise)) / 100.0;
    }

    /// Saturating addition: prevents integer overflow wraps
    pub fn add_sat(self: FixedPointCurrency, other: FixedPointCurrency) FixedPointCurrency {
        return FixedPointCurrency{ .paise = std.math.add(i64, self.paise, other.paise) catch std.math.maxInt(i64) };
    }

    /// Saturating subtraction: prevents negative balances underflow
    pub fn sub_sat(self: FixedPointCurrency, other: FixedPointCurrency) FixedPointCurrency {
        if (other.paise >= self.paise) {
            return FixedPointCurrency{ .paise = 0 };
        }
        return FixedPointCurrency{ .paise = self.paise - other.paise };
    }
};

pub const GstTaxBreakdown = struct {
    total_paise: i64,
    base_amount_paise: i64,
    total_tax_paise: i64,
    cgst_paise: i64,
    sgst_paise: i64,
    igst_paise: i64,
    gst_rate_percent: u8,
    is_interstate: bool,
};

/// Calculates exact Indian GST breakdown from a gross price with 0.00% rounding drift
pub fn calculate_gst_split(total_paise: i64, gst_rate_percent: u8, is_interstate: bool) GstTaxBreakdown {
    if (total_paise <= 0 or gst_rate_percent == 0) {
        return GstTaxBreakdown{
            .total_paise = total_paise,
            .base_amount_paise = total_paise,
            .total_tax_paise = 0,
            .cgst_paise = 0,
            .sgst_paise = 0,
            .igst_paise = 0,
            .gst_rate_percent = gst_rate_percent,
            .is_interstate = is_interstate,
        };
    }

    // Formula: Base = (Total * 10000) / (10000 + (Rate * 100))
    // Scaling by 10000 provides exact half-paisa rounding precision
    const rate_factor: i64 = 10000 + (@as(i64, gst_rate_percent) * 100);
    const scaled_numerator: i64 = total_paise * 10000;
    const base_paise: i64 = @divTrunc(scaled_numerator + @divTrunc(rate_factor, 2), rate_factor);
    const total_tax_paise: i64 = total_paise - base_paise;

    var cgst: i64 = 0;
    var sgst: i64 = 0;
    var igst: i64 = 0;

    if (is_interstate) {
        igst = total_tax_paise;
    } else {
        // Intrastate split: CGST + SGST (handles odd paise exactly)
        cgst = @divTrunc(total_tax_paise, 2);
        sgst = total_tax_paise - cgst;
    }

    return GstTaxBreakdown{
        .total_paise = total_paise,
        .base_amount_paise = base_paise,
        .total_tax_paise = total_tax_paise,
        .cgst_paise = cgst,
        .sgst_paise = sgst,
        .igst_paise = igst,
        .gst_rate_percent = gst_rate_percent,
        .is_interstate = is_interstate,
    };
}
