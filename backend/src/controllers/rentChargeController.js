import * as rentChargeService from '../services/rentChargeService.js';
import {
  generateRentChargesSchema,
  createRentChargeSchema,
  updateRentChargeSchema,
  rentChargeIdParamSchema,
} from '../validators/rentChargeValidators.js';

/**
 * GET /api/rent-charges?month=YYYY-MM&status=unpaid|partial|paid|overdue&tenancyId=...
 */
export async function list(req, res, next) {
  try {
    const { month, status, tenancyId } = req.query;
    const charges = await rentChargeService.listRentCharges(req.user.id, {
      month,
      status,
      tenancyId,
    });

    return res.status(200).json({
      success: true,
      data: { charges },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/rent-charges/:id
 */
export async function getById(req, res, next) {
  try {
    const { id } = rentChargeIdParamSchema.parse(req.params);
    const charge = await rentChargeService.getRentChargeById(req.user.id, id);

    return res.status(200).json({
      success: true,
      data: { charge },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/rent-charges/generate
 * Bulk generate rent charges for a month.
 */
export async function generate(req, res, next) {
  try {
    const { month } = generateRentChargesSchema.parse(req.body);
    const result = await rentChargeService.generateRentCharges(req.user.id, month);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/rent-charges
 * Create a single custom rent charge (partial month amount).
 */
export async function create(req, res, next) {
  try {
    const validatedData = createRentChargeSchema.parse(req.body);
    const charge = await rentChargeService.createRentCharge(req.user.id, validatedData);

    return res.status(201).json({
      success: true,
      data: { charge },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/rent-charges/:id
 * Update a rent charge's amountDue (custom override).
 */
export async function update(req, res, next) {
  try {
    const { id } = rentChargeIdParamSchema.parse(req.params);
    const validatedData = updateRentChargeSchema.parse(req.body);
    const charge = await rentChargeService.updateRentCharge(req.user.id, id, validatedData);

    return res.status(200).json({
      success: true,
      data: { charge },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/rent-charges/:id
 * Remove a rent charge (only if no allocations).
 */
export async function remove(req, res, next) {
  try {
    const { id } = rentChargeIdParamSchema.parse(req.params);
    const result = await rentChargeService.deleteRentCharge(req.user.id, id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/rent-charges/summary?month=YYYY-MM
 */
export async function summary(req, res, next) {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'month query parameter is required in YYYY-MM format',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const result = await rentChargeService.getRentChargeSummary(req.user.id, month);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
