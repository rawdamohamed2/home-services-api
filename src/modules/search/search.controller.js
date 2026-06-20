import * as searchService from "./search.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

export const globalSearch = async (req, res) => {
  try {
    const { keyword } = req.query;

    const results = await searchService.searchCategoriesAndServices(keyword);

    return ApiResponse.success(
      res,
      results,
      results.totalFound > 0 ? "Search results fetched" : "No results found",
    );
  } catch (err) {
    return ApiResponse.serverError(res);
  }
};
