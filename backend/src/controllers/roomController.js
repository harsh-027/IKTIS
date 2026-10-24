import * as roomService from '../services/roomService.js';
import { createRoomSchema, updateRoomSchema, roomIdParamSchema } from '../validators/roomValidators.js';
import { propertyIdParamSchema } from '../validators/propertyValidators.js';

export async function listByProperty(req, res, next) {
  try {
    const { propertyId } = req.params;
    const includeArchived = req.query.includeArchived === 'true';
    const rooms = await roomService.listRooms(req.user.id, propertyId, { includeArchived });

    return res.status(200).json({
      success: true,
      data: {
        rooms,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const { id } = roomIdParamSchema.parse(req.params);
    const room = await roomService.getRoomById(req.user.id, id);

    return res.status(200).json({
      success: true,
      data: {
        room,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const { propertyId } = req.params;
    const validatedData = createRoomSchema.parse(req.body);
    const room = await roomService.createRoom(req.user.id, propertyId, validatedData);

    return res.status(201).json({
      success: true,
      data: {
        room,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = roomIdParamSchema.parse(req.params);
    const validatedData = updateRoomSchema.parse(req.body);
    const room = await roomService.updateRoom(req.user.id, id, validatedData);

    return res.status(200).json({
      success: true,
      data: {
        room,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function archive(req, res, next) {
  try {
    const { id } = roomIdParamSchema.parse(req.params);
    const room = await roomService.archiveRoom(req.user.id, id);

    return res.status(200).json({
      success: true,
      data: {
        room,
        message: 'Room archived successfully.',
      },
    });
  } catch (error) {
    next(error);
  }
}
