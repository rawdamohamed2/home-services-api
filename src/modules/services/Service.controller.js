import {
    checkExistingService,
    checkExistingServiceItem,
    createService,
    createServiceOption,
    deleteServiceOption,
    fetchAllServices,
    updateService,
    updateServiceOption,
    removeService,
    fetchServiceById,
} from "./Service.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

export const addService = async (req, res) => {
    const serviceData = req.body;
    try {
        const existingService = await checkExistingService(serviceData.name);

        if(existingService) throw new Error('Service already exists');

        const service = await createService(serviceData);

        return ApiResponse.success(
            res,
            service,
            "Service is created successfully"
        );

    }catch (err){
        return ApiResponse.error(res, err.message);
    }
};

export const editService = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        const updatedService = await updateService(id, updateData);
        return ApiResponse.success(
            res,
            updatedService,
            "Service is updated successfully"
        );
    }catch (e) {
        return ApiResponse.error(
            res,
            e.message
        );
    }
};

export const addServiceItem = async (req, res) => {
    const { serviceId } = req.params;
    const optionData = req.body;

    try {

        await checkExistingServiceItem(optionData.optionName);
        const service = await createServiceOption(serviceId, optionData);

        ApiResponse.success(
            res,
            service,
            "Service item is created successfully"
        );
    }catch (e) {
        ApiResponse.error(
            res,
            e.message
        );
    }
};

export const editServiceItem = async (req, res) => {
    const { serviceId, optionId } = req.params;
    const optionData = req.body;

    try {
        const service = await updateServiceOption(serviceId, optionId, optionData);

        return ApiResponse.success(
            res,
            service,
            "Service Item is updated successfully"
        );
    }catch (e) {
        return ApiResponse.error(
            res,
            e.message
        );
    }
};

export const deleteServiceItem = async (req, res) => {
    const { serviceId, optionId } = req.params;

    try {
        const updatedService = await deleteServiceOption(serviceId, optionId);

        return ApiResponse.success(
            res,
            updatedService,
            "Service Item is delete successfully"
        );
    }catch (e) {
        return ApiResponse.error(
            res,
            e.message
        );
    }
};

export const deleteService = async (req, res) => {
    const { serviceId } = req.params;
    try {
        const deletedService = await removeService(serviceId);

        return ApiResponse.success(
            res,
            "",
            deletedService
        );
    }catch (e) {
        return ApiResponse.error(
            res,
            e.message
        );
    }
};

export const getServices = async (req, res) => {
    try {
        const result = await fetchAllServices(req.query);

        return ApiResponse.success(
            res,
            {
            services: result.services,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                pages: Math.ceil(result.total / result.limit)
            }
        }, 'services fetched successfully');
    }
    catch(error){
        return ApiResponse.error(
            res,
            error.message
        );
    }
};

export const getServiceById = async (req, res) => {

    const { serviceId } = req.params;

    try {
        const Service = await fetchServiceById(serviceId);

        return ApiResponse.success(
            res,
            Service,
            "service fetched successfully "
        );
    }catch (e) {
        return ApiResponse.error(
            res,
            e.message
        );
    }
};