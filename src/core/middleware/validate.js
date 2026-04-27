import ApiResponse from "../utils/ApiResponse.js";

export const validate = (schema) => {
    return (req, res, next) => {

        const body = req.body || {};
        const query = req.query || {};
        const params = req.params || {};

        const dataSource = { ...params, ...query, ...body };

        const { error, value } = schema.validate(dataSource, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(err => ({
                field: err.path[0],
                message: err.message
            }));
            return ApiResponse.validationError(res, errors);
        }


        if (Object.keys(params).length > 0) Object.assign(req.params, value);
        if (Object.keys(query).length > 0) Object.assign(req.query, value);
        if (Object.keys(body).length > 0) req.body = value;

        next();
    };
};