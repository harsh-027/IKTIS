import * as propertyService from '../services/propertyService.js';
import { createPropertySchema, updatePropertySchema, propertyIdParamSchema } from '../validators/propertyValidators.js';

export async function list(req, res, next) {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const properties = await propertyService.listProperties(req.user.id, { includeArchived });

    return res.status(200).json({
      success: true,
      data: {
        properties,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const { id } = propertyIdParamSchema.parse(req.params);
    const property = await propertyService.getPropertyById(req.user.id, id);

    return res.status(200).json({
      success: true,
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const validatedData = createPropertySchema.parse(req.body);
    const property = await propertyService.createProperty(req.user.id, validatedData);

    return res.status(201).json({
      success: true,
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = propertyIdParamSchema.parse(req.params);
    const validatedData = updatePropertySchema.parse(req.body);
    const property = await propertyService.updateProperty(req.user.id, id, validatedData);

    return res.status(200).json({
      success: true,
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function archive(req, res, next) {
  try {
    const { id } = propertyIdParamSchema.parse(req.params);
    const property = await propertyService.archiveProperty(req.user.id, id);

    return res.status(200).json({
      success: true,
      data: {
        property,
        message: 'Property archived successfully.',
      },
    });
  } catch (error) {
    next(error);
  }
}
