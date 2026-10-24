import * as tenantService from '../services/tenantService.js';
import { createTenantSchema, updateTenantSchema, tenantIdParamSchema } from '../validators/tenantValidators.js';

export async function list(req, res, next) {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const search = req.query.search || '';
    const tenants = await tenantService.listTenants(req.user.id, { includeArchived, search });

    return res.status(200).json({
      success: true,
      data: {
        tenants,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const { id } = tenantIdParamSchema.parse(req.params);
    const tenant = await tenantService.getTenantById(req.user.id, id);

    return res.status(200).json({
      success: true,
      data: {
        tenant,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const validatedData = createTenantSchema.parse(req.body);
    const tenant = await tenantService.createTenant(req.user.id, validatedData);

    return res.status(201).json({
      success: true,
      data: {
        tenant,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = tenantIdParamSchema.parse(req.params);
    const validatedData = updateTenantSchema.parse(req.body);
    const tenant = await tenantService.updateTenant(req.user.id, id, validatedData);

    return res.status(200).json({
      success: true,
      data: {
        tenant,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function archive(req, res, next) {
  try {
    const { id } = tenantIdParamSchema.parse(req.params);
    const tenant = await tenantService.archiveTenant(req.user.id, id);

    return res.status(200).json({
      success: true,
      data: {
        tenant,
        message: 'Tenant archived successfully.',
      },
    });
  } catch (error) {
    next(error);
  }
}
