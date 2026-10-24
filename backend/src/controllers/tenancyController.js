import * as tenancyService from '../services/tenancyService.js';
import { createTenancySchema, endTenancySchema, tenancyIdParamSchema } from '../validators/tenancyValidators.js';

export async function list(req, res, next) {
  try {
    const { roomId, tenantId, status } = req.query;
    const tenancies = await tenancyService.listTenancies(req.user.id, { roomId, tenantId, status });

    return res.status(200).json({
      success: true,
      data: {
        tenancies,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const { id } = tenancyIdParamSchema.parse(req.params);
    const tenancy = await tenancyService.getTenancyById(req.user.id, id);

    return res.status(200).json({
      success: true,
      data: {
        tenancy,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const validatedData = createTenancySchema.parse(req.body);
    const tenancy = await tenancyService.createTenancy(req.user.id, validatedData);

    return res.status(201).json({
      success: true,
      data: {
        tenancy,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function endTenancy(req, res, next) {
  try {
    const { id } = tenancyIdParamSchema.parse(req.params);
    const validatedData = endTenancySchema.parse(req.body);
    const tenancy = await tenancyService.endTenancy(req.user.id, id, validatedData);

    return res.status(200).json({
      success: true,
      data: {
        tenancy,
        message: 'Tenancy concluded successfully.',
      },
    });
  } catch (error) {
    next(error);
  }
}
