const express = require("express");
const router = express.Router();

const loadData = () => {
 

  let favList = fs.readFileSync("Favorite.json", "utf8");
  favList = JSON.parse(favList);

  return favList;
};

/* POST favorite list */
router.post(
  "/favorite",
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
          fs.writeFile("./favorite.json", addCompaniesData, (err) => {});
          return sendResponse(200, {}, message, res, next);
        }
      }
    } catch (error) {
      next(error);
    }
  }
);


/* DELETE favorite list */
module.exports = router;
