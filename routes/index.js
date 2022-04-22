const express = require("express");
const router = express.Router();
const fs = require("fs");
const sendResponse = require("../helpers/utilitis");
const isAuthenticated = require("../middleware/isAuthenticated");

const loadData = () => {
  //read part of the file
  let jobData = fs.readFileSync("data2.json", "utf8");
  return JSON.parse(jobData);
};

/* GET companies. */
router.get("/companies", function (req, res, next) {
  const page = req.query.page || 1;
  const limit = req.query.limit || 20;
  const city = req.query.city;

  let companiesList = [];
  let message = "";
  const companiesData = loadData().companies;
  console.log("city", city);
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

    return sendResponse(200, companiesListToRender || {}, message, res, next);
  } catch (error) {
    next(error);
  }
});

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

router.post("/companies", isAuthenticated, function (req, res, next) {
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
});

router.put("/companies/:id", isAuthenticated, function (req, res, next) {
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
});

router.delete("/companies/:id", isAuthenticated, function (req, res, next) {
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
});

module.exports = router;
