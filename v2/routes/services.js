const express = require("express");
const router = express.Router();
const serviceRepo = require("../repository/serviceRepo");

// Helper to build nested structure
function buildTree(services, parentId = null) {
    return services
        .filter(service => service.parentId === parentId)
        .map(service => ({
            id:service.id,
            service: service.service,
            link: service.link,
            image: service.image,
            serviceType: service.serviceType === "Deep Link"
                ? 1
                : service.serviceType === "Link"
                    ? 2
                    : service.serviceType === "Group Link"
                        ? 3
                        : null, children: buildTree(services, service.id)
        }));
}

router.get("/", async (req, res, next) => {
    try {
        const services = await serviceRepo.getAll();
        const tree = buildTree(services.rows);
        res.json({ success: true, data: { services: tree } });
    } catch (err) {
        next(err);
    }
});

module.exports = router; 