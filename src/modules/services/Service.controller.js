import Service from "./Service.model.js"
import {checkExistingService, createService, updateService} from "./Service.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import returnApiResponse from "../../core/utils/ApiResponse.js";


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
}

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
}

export const deleteService = async (req, res) => {

}

export const getServices = async (req, res) => {

}

export const getServiceById = async (req, res) => {

}