import Service from "./Service.model.js"

export const checkExistingService = async (name) => {
    const existing = await Service.findOne({ name });
    if (existing) throw new Error('Service already exists with this name');
    return false;
};

export const createService = async (serviceData) => {
    try {
        const newService = new Service(serviceData);
        await newService.save();
        return newService;
    }catch (e) {
        throw new Error(e);
    }
};

export const updateService = async (id, updateData) => {
    try {
        const updatedService = await Service.findByIdAndUpdate(
            id,
            updateData,
            { returnDocument: 'after', runValidators: true }
        );
        return updatedService;
    }catch (e) {
        throw new Error(e.message);
    }
};