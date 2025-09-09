const express = require("express");
const router = express.Router();
const serviceRepo = require("../repository/serviceRepo");
const { translateObjectValues } = require("../services/translationService");
const supportedLanguages = require("../constants/supportedLanguages");

// Helper to build nested structure
function buildTree(services, parentId = null) {
    return services
        .filter(service => service.parentId === parentId)
        .map(service => ({
            id: service.id,
            service: service.service,
            link: service.link,
            image: service.image,
            description: service.description,
            serviceType: service.serviceType === "Deep Link"
                ? 1
                : service.serviceType === "Link"
                    ? 2
                    : service.serviceType === "Group Link"
                        ? 3
                        : service.serviceType === "Form" ? 4 : null, children: buildTree(services, service.id)
        }));
}

router.get("/", async (req, res, next) => {
    try {
        const services = await serviceRepo.getAll();
        const tree = buildTree(services.rows);

        // Resolve language from Accept-Language header
        const acceptLanguage = req.headers["accept-language"] || "";
        const requested = acceptLanguage.split(",")[0].trim().toLowerCase();
        const fallback = "de";
        const supportedLower = new Set(supportedLanguages.map(l => l.toLowerCase()));
        const targetLang = supportedLower.has(requested) ? (requested === 'en' ? 'en-US' : requested) : fallback;

        // Translate only description fields
        if (targetLang !== 'de') {
            const translated = await translateObjectValues({ services: tree }, targetLang, ["service", "text"]);
            res.json({ success: true, data: translated });
        } else {
            res.json({ success: true, data: { services: tree } });
        }

    } catch (err) {
        next(err);
    }
});

module.exports = router;