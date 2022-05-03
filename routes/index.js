const express = require("express");
const router = express.Router();
const fs = require("fs");
const sendResponse = require("../helpers/utilitis");
const isAuthenticated = require("../middleware/isAuthenticated");
const validateQuery = require("../middleware/validateQuery");

const loadData = () => {
  //read part of the file

  let jobData = fs.readFileSync("data2.json", "utf8");
  jobData = JSON.parse(jobData);
  jobData.ratings.forEach(
    (rating, index) =>
      (jobData.ratings[index] = {
        ...rating,
        averageRatings:
          (rating.workLifeBalanceRatings +
            rating.payAndBenefits +
            rating.jobsSecurityAndAdvancement +
            rating.management +
            rating.culture) /
          5,
      })
  );
  let map = {};
  jobData.ratings.forEach(
    (rating) =>
      (map[rating.id] = { id: rating.id, average: rating.averageRatings })
  );

  jobData.companies.forEach((company) =>
    company.ratings.forEach(
      (rating, index) => (company.ratings[index] = map[rating].average)
    )
  );
  jobData.companies.forEach((company) => {
    let sum = 0;
    company.ratings.forEach((rating) => (sum = sum + parseInt(rating)));
    company.averageRating =
      Math.round((sum / company.numOfRatings) * 10000) / 10000;
  });
  return jobData;
};

/* GET companies. */
router.get("/companies", validateQuery, function (req, res, next) {
  const page = req.query.page;
  const limit = req.query.limit || 20;
  const city = req.query.city;
  const sortBy = req.query.sortBy;
  console.log("sort", sortBy);

  let companiesList = [];
  let message = "";
  const companiesData = loadData().companies;
  // console.log("city", city);
  try {
    if (!city) {
      companiesList = companiesData;
      message = "no city";
    } else {
      const citySplit = city.split(",");
      // const city1 = citySplit[0];
      // const city2 = citySplit[1] || "";
      const jobsData = loadData().jobs;
      let jobsByCity = [];
      citySplit.forEach(
        (city) =>
          (jobsByCity = [
            ...jobsByCity,
            ...jobsData.filter((job) => job.city === city),
          ])
      );
      companiesIdbyCity = jobsByCity.map((job) => job.companyId);
      companiesList = companiesData.filter(
        (company) => companiesIdbyCity.indexOf(company.id) > -1
      );
      message = "city";
    }
    if (sortBy) {
      console.log(sortBy);
      let order = req.query.order;
      if (order === "asc") {
        companiesList.sort((a, b) => a.averageRating - b.averageRating);
        message = "sort asc";
      } else if (order === "desc") {
        companiesList.sort((a, b) => b.averageRating - a.averageRating);
        message = "sort desc";
      }
    }

    let startIndex;
    let endIndex;
    if (page * limit <= companiesList.length) {
      startIndex = (page - 1) * limit;
      endIndex = page * limit;
      // message = `Get companies list by page ${page} with limit of ${limit}`;
    } else if ((page - 1) * limit <= companiesList.length) {
      startIndex = (page - 1) * limit;
      endIndex = companiesList.length;
      // message = `Get companies list by page ${page} with limit of ${limit}`;
    } else if ((page - 1) * limit > companiesList.length) {
      startIndex = companiesList.length;
      endIndex = companiesList.length;
      message = `Page request is greater than database`;
    }
    console.log(companiesList.length);
    companiesListToRender = companiesList.slice(startIndex, endIndex);
    const totalPages = Math.ceil(companiesList.length / limit);

    return sendResponse(
      200,
      { companies: companiesListToRender, total_pages: totalPages } || {},
      message,
      res,
      next
    );
  } catch (error) {
    next(error);
  }
});

/* test */
router.get("/test", function (req, res, next) {
  const city = req.query.city;
  console.log(city);
  if (city) {
    message = "city";
    citySplit = city.split(",");
    city1 = citySplit[1];
    city2 = citySplit[2] || "";

    if (!city2) {
      message = "no city2";
    }
  } else {
    message = "nocity";
  }

  return sendResponse(200, { city }, message, res, next);
});

/* GET company by ID. */

router.get("/companies/:id", validateQuery, function (req, res, next) {
  const { id } = req.params;

  let message = `Get company by id ${id}`;
  let selectedCompany;
  try {
    const db = loadData().companies;
    selectedCompany = db.find((company) => company.id === id);
    if (!selectedCompany) {
      message = "Company with given id is not found";
    }
  } catch (error) {
    console.log(error);
  }
  return sendResponse(200, selectedCompany || {}, message, res, next);
});

router.post(
  "/companies",
  validateQuery,
  isAuthenticated,
  function (req, res, next) {
    let message = "";
    let index;

    try {
      const {
        id,
        name,
        benefits,
        description,
        ratings,
        job,
        numOfJobs,
        numOfRatings,
      } = req.body;
      if (
        !id ||
        !name ||
        !benefits ||
        !description ||
        !ratings ||
        !job ||
        !numOfJobs ||
        !numOfRatings
      ) {
        const error = new Error("Missing infor");
        error.statusCode = 400;
        throw error;
      }
      {
        const data = loadData();
        index = data.companies.map((e) => e.id).indexOf(id);
        if (index !== -1) {
          const error = new Error("Company is already existed");
          error.statusCode = 400;
          throw error;
        } else {
          message = ` add company ${name}`;
          const companyObj = {
            id,
            name,
            benefits,
            description,
            ratings,
            job,
            numOfJobs: parseInt(numOfJobs),
            numOfRatings: parseInt(numOfRatings),
          };
          data.companies.push(companyObj);
          addCompaniesData = JSON.stringify(data);
          fs.writeFile("./data2.json", addCompaniesData, (err) => {});
          return sendResponse(200, {}, message, res, next);
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/companies/:id",
  isAuthenticated,
  validateQuery,
  function (req, res, next) {
    try {
      const { id } = req.params;
      let data = loadData();
      index = data.companies.map((e) => e.id).indexOf(id);
      if (index === -1) {
        const error = new Error("Company not found");
        error.statusCode = 400;
        throw error;
      }
      {
        message = `${index} add enterprise`;
        data.companies[index] = { ...data.companies[index], enterprise: true };
        let addData = JSON.stringify(data);
        fs.writeFile("./data2.json", addData, (err) => {});
        return sendResponse(200, {}, message, res, next);
      }
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/companies/:id",
  isAuthenticated,
  validateQuery,
  function (req, res, next) {
    try {
      const data = loadData();

      const { id } = req.params;
      index = data.companies.map((e) => e.id).indexOf(id);
      if (index === -1) {
        const error = new Error("Company not found");
        error.statusCode = 400;
        throw error;
      }
      {
        message = `${index} delete`;
        data.companies.splice(index, 1);
        const addData = JSON.stringify(data);
        fs.writeFile("./data2.json", addData, (err) => {});
        return sendResponse(200, {}, message, res, next);
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
