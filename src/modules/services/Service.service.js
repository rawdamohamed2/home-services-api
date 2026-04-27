import Service from "./service.model.js";
import Category from "../categories/Category.model.js";

export const checkExistingService = async (name) => {
  const existing = await Service.findOne({ name });
  if (existing) throw new Error("Service already exists with this name");
  return false;
};
export const checkExistingServiceItem = async (optionName) => {
  const existing = await Service.findOne({
    "priceOptions.optionName": optionName,
  });
  if (existing) {
    throw new Error(`Service Item with name "${optionName}" already exists`);
  }
  return false;
};

export const createService = async (serviceData) => {
  try {
    const newService = new Service(serviceData);
    await newService.save();
    return newService;
  } catch (e) {
    throw new Error(e);
  }
};

export const updateService = async (id, updateData) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
    return updatedService;
  } catch (e) {
    throw new Error(e.message);
  }
};

export const createServiceOption = async (serviceId, optionData) => {
  try {
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error("Service not found");
    }
    service.priceOptions.push(optionData);
    await service.save();
    return service;
  } catch (e) {
    throw new Error(e.message);
  }
};

export const updateServiceOption = async (serviceId, optionId, optionData) => {
  try {
    const updatedService = await Service.findOneAndUpdate(
      {
        _id: serviceId,
        "priceOptions._id": optionId,
      },
      {
        $set: {
          "priceOptions.$": { ...optionData, _id: optionId },
        },
      },
      { new: true, runValidators: true },
    );

    if (!updatedService) {
      throw new Error("Service not found");
    }

    return updatedService;
  } catch (e) {
    throw new Error(e.message);
  }
};

export const deleteServiceOption = async (serviceId, optionId) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      {
        $pull: { priceOptions: { _id: optionId } },
      },
      { new: true },
    );

    if (!updatedService) {
      throw new Error("Service not found");
    }
    return updatedService;
  } catch (e) {
    throw new Error(e.message);
  }
};

export const removeService = async (serviceId) => {
  try {
    const deletedService = await Service.findByIdAndDelete(serviceId);

    if (!deletedService) {
      throw new Error("Service not found");
    }
    return "Service is deleted successfully";
  } catch (e) {
    throw new Error(e.message);
  }
};

export const fetchAllServices = async (filters) => {
  try {
    const { page = 1, limit = 5, category, status, name, id } = filters;
    const query = {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (status) {
      query.isActive = status.trim();
    }

    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        return {
          workers: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
        };
      }
    }
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }
    if (id) {
      query._id = id;
    }

    const [services, total] = await Promise.all([
      Service.find(query)
        .select(
          "name description image basePrice estimatedTime isActive priceOptions",
        )
        .populate({ path: "category", select: "name" })
        .limit(parseInt(limit))
        .skip(skip)
        .sort("-ratingAverage"),
      Service.countDocuments(query),
    ]);

    return {
      services,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  } catch (e) {
    throw new Error(e.message);
  }
};

export const fetchServiceById = async (serviceId) => {
  try {
    const service = await Service.findById(serviceId).populate({
      path: "category",
      select: "name",
    });

    if (!service) {
      throw new Error("Service not found");
    }

    return service;
  } catch (e) {
    throw new Error(e.message);
  }
};
