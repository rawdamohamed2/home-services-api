import ApiResponse from "../utils/ApiResponse.js";

// export const validate = (schema) => {
//     return (req, res, next) => {
//         const body = req.body || {};
//         const query = req.query || {};
//
//         // نحدد المصدر (إذا كان GET نستخدم query، غير ذلك نستخدم body)
//         const isGetRequest = req.method === 'GET';
//         const dataSource = isGetRequest ? query : body;
//
//         const { error, value } = schema.validate(dataSource, {
//             abortEarly: false,
//             stripUnknown: true
//         });
//
//         if (error) {
//             const errors = error.details.map(err => ({
//                 field: err.path[0],
//                 message: err.message
//             }));
//
//             return ApiResponse.validationError(res, errors);
//         }
//
//         // بدلاً من req.query = value (التي تسبب الخطأ)
//         // نقوم بتفريغ الكائن القديم وملئه بالقيم الجديدة المصححة (Converted types)
//         if (isGetRequest) {
//             Object.keys(req.query).forEach(key => delete req.query[key]);
//             Object.assign(req.query, value);
//         } else {
//             req.body = value; // الـ body عادة يسمح بالاستبدال، لكن Object.assign أضمن
//         }
//
//         next();
//     };
// };

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