const AppError = require("../utils/appError");
const adsRepository = require("../repository/advertisementsRepo");
const citiesRepository = require("../repository/citiesRepo");
const listingRepository = require("../repository/listingsRepo");


const getRandomAds = async function (cityId, listingId) {
    try {
        const currentDate = new Date();
        if (cityId) {
            if (Number(cityId)) {
                const city = await citiesRepository.getOne({
                    filters: [
                        {
                            key: "id",
                            sign: "=",
                            value: cityId,
                        },
                    ],
                });
                if (!city) {
                    throw new AppError(`Invalid City '${cityId}' given`, 400);
                }
            } else {
                throw new AppError("Invalid CityID given", 400);
            }
        } else {
            throw new AppError("CityID is not given", 400);
        }

        const responseListings = await listingRepository.getAll({
            filters: [
                {
                    key: "createdAt",
                    sign: ">",
                    value: new Date(currentDate - (12 * 60 * 60 * 1000)),
                },
                {
                    key: "length(description)",
                    sign: ">",
                    value: 10,
                },
                {
                    key: "categoryId",
                    sign: "IN",
                    value: [1, 3],
                },
                {
                    key: "showExternal",
                    sign: "=",
                    value: false,
                },
            ],
            orderBy: ["createdAt"],
            pageSize: 1,
            cityId,
        });

        const dataListings = responseListings.rows;
        if (!dataListings || dataListings.length <= 0 || dataListings[0].id !== Number(listingId)) {
            return null;
        }

        const cityIdAds = await adsRepository.getAll({
            filters: [
                {
                    key: "cityId",
                    sign: "=",
                    value: cityId,
                },
                {
                    key: "enabled",
                    sign: "=",
                    value: 1,
                },
            ]
        });

        const noCityIdAds = await adsRepository.getAll({
            filters: [
                {
                    key: "cityId",
                    sign: "IS",
                    value: null,
                },
                {
                    key: "enabled",
                    sign: "=",
                    value: 1,
                },
            ]
        });

        const allAds = cityIdAds.rows.concat(noCityIdAds.rows);
        const dataReturn = allAds[(Math.floor(Math.random() * allAds.length))];
        if (dataReturn) {
            await adsRepository.update({
                data: {
                    lastShown: currentDate,
                },
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: dataReturn.id,
                    },
                ]
            });
        }
        return dataReturn;

    } catch (err) {
        console.error(err);
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const getAdLists = async function (cityId, skipAdIds, returnAdsCount, sort, sortDesc) {
    try {
        const currentDate = new Date();
        if (cityId) {
            const city = await citiesRepository.getOne({
                filters: [
                    {
                        key: "id",
                        sign: "=",
                        value: cityId,
                    },
                ]
            });
            if (!city) {
                throw new AppError(`Invalid City '${cityId}' given`, 400);
            }
        }
        // get ads
        const filters = [{
            key: "enabled",
            sign: "=",
            value: 1,
        }];
        if (cityId) {
            filters.push({
                key: "cityId",
                sign: "=",
                value: cityId,
            });
        }

        const countFilters = [...filters];

        if (skipAdIds.length > 0) {
            filters.push({
                key: "id",
                sign: "NOT IN",
                value: skipAdIds,
            });
        }
        const ads = await adsRepository.getAll({
            filters,
            columns: "id, cityId, image, link, createdAt",
            orderBy: [sort],
        });

        const countResponse = await adsRepository.getOne({
            filters: countFilters,
            columns: "COUNT(*) as totalCount",
        });

        if (ads.count > 0) {
            await adsRepository.update({
                data: {
                    lastShown: currentDate,
                },
                filters: [
                    {
                        key: "id",
                        sign: "IN",
                        value: ads.rows.map((ad) => ad.id),
                    },
                ]
            });
        }

        return {
            ads: ads.rows,
            totalCount: countResponse.totalCount,
        };

    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

module.exports = {
    getRandomAds,
    getAdLists,
};
