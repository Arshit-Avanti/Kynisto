-- ==============================================================================
-- 🌙 Kynisto Lua Core Engine: Sandboxed Dynamic Rule & Priority Processor
-- Ultra-lightweight, safe, and zero-eval execution of merchant promotions,
-- consultation fee discounts, and clinic queue priority overrides.
-- ==============================================================================

local M = {}

-- Evaluates dynamic e-commerce or clinic consultation promotional rules
function M.evaluate_discount_rule(context)
    local cart_total = context.cart_total or 0
    local user_orders = context.user_orders or 0
    local day_of_week = context.day_of_week or "monday"
    local promo_code = string.upper(context.promo_code or "")

    local discount_amount = 0
    local applied_rule = "NONE"

    -- Rule 1: FIRST50 - First-time user ₹100 off on cart >= ₹500
    if promo_code == "FIRST100" and user_orders == 0 and cart_total >= 500 then
        discount_amount = 100
        applied_rule = "FIRST_ORDER_WELCOME"

    -- Rule 2: SUNDAYHEALTH - 15% off consultations/orders on Sunday (capped at ₹150)
    elseif (promo_code == "SUNDAY15" or day_of_week:lower() == "sunday") and cart_total >= 1000 then
        local calculated = math.floor(cart_total * 0.15)
        discount_amount = math.min(calculated, 150)
        applied_rule = "SUNDAY_SPECIAL_15_PERCENT"

    -- Rule 3: SENIORCARE - 20% off for senior citizens (age >= 65) capped at ₹200
    elseif promo_code == "SENIOR20" and (context.patient_age or 0) >= 65 and cart_total >= 400 then
        local calculated = math.floor(cart_total * 0.20)
        discount_amount = math.min(calculated, 200)
        applied_rule = "SENIOR_CITIZEN_CARE"
    end

    local final_total = math.max(0, cart_total - discount_amount)

    return {
        original_total = cart_total,
        discount_amount = discount_amount,
        final_total = final_total,
        applied_rule = applied_rule,
        is_discounted = discount_amount > 0
    }
end

-- Evaluates dynamic patient queue priority overrides
-- Returns: 1 (Emergency/Super-Senior), 2 (Priority OPD/Infant), 3 (Standard)
function M.evaluate_queue_priority_rule(context)
    local age = context.patient_age or 30
    local is_emergency = context.is_emergency == true or context.is_emergency == 1
    local symptoms = string.lower(context.symptoms or "")
    local has_severe_pain = context.has_severe_pain == true

    -- Priority 1: Critical Emergency or Super-Senior Citizen (Age >= 75)
    if is_emergency or string.find(symptoms, "chest pain") or string.find(symptoms, "breathless") then
        return {
            priority_tier = 1,
            label = "EMERGENCY_FAST_TRACK",
            reason = "Life-threatening acute red-flag or physician emergency flag"
        }
    elseif age >= 75 then
        return {
            priority_tier = 1,
            label = "SUPER_SENIOR_PRIORITY",
            reason = "Geriatric patient protection protocol (Age >= 75)"
        }
    end

    -- Priority 2: Senior Citizen (Age >= 60), Infant (Age <= 2), or Acute Pain
    if age >= 60 then
        return {
            priority_tier = 2,
            label = "SENIOR_CITIZEN_PRIORITY",
            reason = "Senior citizen priority care (Age >= 60)"
        }
    elseif age <= 2 then
        return {
            priority_tier = 2,
            label = "PEDIATRIC_INFANT_PRIORITY",
            reason = "Infant vital protection protocol (Age <= 2)"
        }
    elseif has_severe_pain then
        return {
            priority_tier = 2,
            label = "ACUTE_DISTRESS_PRIORITY",
            reason = "Acute pain distress protocol"
        }
    end

    -- Priority 3: Standard Outpatient Visit
    return {
        priority_tier = 3,
        label = "STANDARD_OPD",
        reason = "Standard queue sequence order"
    }
end

-- Evaluates dynamic loyalty points multiplier
function M.evaluate_loyalty_multiplier(tier, base_points)
    local points = base_points or 10
    local t = string.lower(tier or "bronze")

    if t == "platinum" then
        return points * 3
    elseif t == "gold" then
        return points * 2
    elseif t == "silver" then
        return math.floor(points * 1.5)
    else
        return points
    end
end

return M
