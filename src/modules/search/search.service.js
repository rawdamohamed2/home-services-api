import Service from "../services/service.model.js";
import Category from "../categories/Category.model.js";

export const searchCategoriesAndServices = async (keyword) => {
  try {
    if (!keyword) return { categories: [], services: [] };

    const searchRegex = new RegExp(keyword, "i");

    const categories = await Category.find({
      name: searchRegex,
      isActive: true,
    }).select("_id name image");

    const services = await Service.find({
      $or: [{ name: searchRegex }, { description: searchRegex }],
      isActive: true,
    }).select("_id name");

    return {
      categories,
      services,
      totalFound: categories.length + services.length,
    };
  } catch (error) {
    throw error;
  }
};
