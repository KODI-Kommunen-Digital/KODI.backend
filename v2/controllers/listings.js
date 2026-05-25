const roles = require("../constants/roles");
const listingService = require("../services/listings");
const pollRepository = require("../repository/pollOptionsRepo");
const listingsRepository = require("../repository/listingsRepo");
const sendMail = require("../utils/sendMail");

function escapeHtml(s) {
    if (s === null || s === undefined) {
        return "";
    }
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatTimeBerlin(date) {
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat("de-DE", {
        timeZone: "Europe/Berlin",
        dateStyle: "medium",
        timeStyle: "short",
    }).format(d);
}

function resolveVoteQuestionAndOptionLabels(titleMap, listingId, optionId, pollRows) {
    let questionTitle = `Eintrag ${listingId}`;
    const mapped =
        titleMap[listingId] ??
        titleMap[Number(listingId)];
    if (mapped != null && mapped !== "") {
        questionTitle = mapped;
    }

    const optRow = pollRows.find(
        (r) =>
            String(r.listingId) === String(listingId) &&
            String(r.id) === String(optionId),
    );
    let optionTitle = `Antwort-ID ${optionId}`;
    if (optRow && optRow.title != null && optRow.title !== "") {
        optionTitle = optRow.title;
    } else if (optRow) {
        optionTitle = `Antwort ${optionId}`;
    }

    return { questionTitle, optionTitle };
}

function groupPollOptionsByListing(rows) {
    const byId = new Map();
    for (const r of rows) {
        const lid = r.listingId;
        if (lid === undefined || lid === null) {
            continue;
        }
        if (!byId.has(lid)) {
            byId.set(lid, []);
        }
        byId.get(lid).push(r);
    }
    const sortedListingIds = [...byId.keys()].sort(
        (a, b) => Number(a) - Number(b),
    );
    return sortedListingIds.map((listingId) => {
        const options = byId.get(listingId).slice().sort(
            (a, b) => Number(a.id) - Number(b.id),
        );
        return { listingId, options };
    });
}

async function fetchListingTitlesMap(listingIds) {
    if (!listingIds.length) {
        return {};
    }
    const resp = await listingsRepository.getAll({
        filters: [
            {
                key: "id",
                sign: "IN",
                value: listingIds,
            },
        ],
        columns: "id, title",
    });
    const map = {};
    for (const row of resp.rows ?? []) {
        map[row.id] = row.title;
    }
    return map;
}

function buildPollVoteReportEmailBodies({
    listingId,
    optionId,
    voteDelta,
    groups,
    titleMap,
    pollRows,
    generatedAtBerlin,
}) {
    const voteLabel =
        voteDelta === 1 ? "+1" : voteDelta === -1 ? "-1" : String(voteDelta);

    const { questionTitle, optionTitle } = resolveVoteQuestionAndOptionLabels(
        titleMap,
        listingId,
        optionId,
        pollRows,
    );

    const headerLines = [
        "Aktualisierung der Feedback-Stimmen",
        "",
        `Zeit (Europa/Berlin): ${generatedAtBerlin}`,
        `Letzte Stimme — „${questionTitle}“ → „${optionTitle}“ (Änderung ${voteLabel})`,
        "",
    ];

    let bodyLines = [];
    if (!groups.length) {
        bodyLines = ["(Keine Umfrage-Optionen in der Datenbank.)", ""];
    } else {
        groups.forEach((g, idx) => {
            const listingKey = g.listingId;
            const title =
                (titleMap[listingKey] != null && titleMap[listingKey] !== "")
                    ? titleMap[listingKey]
                    : (titleMap[Number(listingKey)] != null &&
                          titleMap[Number(listingKey)] !== "")
                        ? titleMap[Number(listingKey)]
                        : `Eintrag ${g.listingId}`;
            bodyLines.push(`Frage ${idx + 1}: ${title}`, "");
            for (const o of g.options) {
                const label =
                    o.title != null && o.title !== ""
                        ? o.title
                        : `Antwort ${o.id}`;
                bodyLines.push(`  ${label} — ${o.votes ?? 0}`);
            }
            bodyLines.push("");
        });
    }

    const plainText = [
        ...headerLines,
        ...bodyLines,
        "— Automatische Nachricht vom KODI-Backend",
    ].join("\n");

    let sectionsHtml;
    if (!groups.length) {
        sectionsHtml =
            '<p style="color:#666;">Keine Umfrage-Optionen in der Datenbank.</p>';
    } else {
        sectionsHtml = groups
            .map((g, idx) => {
                const listingKey = g.listingId;
                const title =
                    (titleMap[listingKey] != null && titleMap[listingKey] !== "")
                        ? titleMap[listingKey]
                        : (titleMap[Number(listingKey)] != null &&
                              titleMap[Number(listingKey)] !== "")
                            ? titleMap[Number(listingKey)]
                            : `Eintrag ${g.listingId}`;
                const items = g.options
                    .map((o) => {
                        const label =
                            o.title != null && o.title !== ""
                                ? o.title
                                : `Antwort ${o.id}`;
                        return `<li style="margin:8px 0;line-height:1.4;">${escapeHtml(label)} — <strong>${escapeHtml(o.votes ?? 0)}</strong></li>`;
                    })
                    .join("");
                return `<div style="background:#e5e7eb;border-radius:8px;padding:18px 22px;margin:16px 0;max-width:560px;">
<p style="margin:0 0 6px;font-size:13px;color:#64748b;">Frage ${idx + 1}</p>
<h3 style="margin:0 0 14px;font-size:18px;font-weight:600;color:#0c4a6e;line-height:1.35;">${escapeHtml(title)}</h3>
<ul style="margin:0;padding-left:20px;color:#0f172a;list-style-type:disc;">${items}</ul>
</div>`;
            })
            .join("");
    }

    const html = `<!DOCTYPE html>
<html><body style="font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.45;color:#222;">
<p style="margin:0 0 8px;"><strong>Aktualisierung der Feedback-Stimmen</strong></p>
<p style="margin:0 0 6px;color:#555;font-size:14px;">Zeit (Europa/Berlin): ${escapeHtml(generatedAtBerlin)}</p>
<p style="margin:0 0 20px;color:#555;font-size:14px;"><strong>Letzte Stimme:</strong> ${escapeHtml(questionTitle)} → ${escapeHtml(optionTitle)} <span style="color:#64748b;">(Änderung ${escapeHtml(voteLabel)})</span></p>
<p style="margin:0 0 12px;font-size:14px;color:#334155;">Aktuelle Stimmenzahlen aller Feedback-Fragen:</p>
${sectionsHtml}
<p style="margin:28px 0 0;font-size:13px;color:#888;">Dies ist eine automatische Nachricht vom KODI-Backend.</p>
</body></html>`;

    return { plainText, html };
}

async function sendPollVoteReportEmail({ listingId, optionId, voteDelta }) {
    const to = process.env.POLL_VOTE_REPORT_EMAIL;
    if (!to || !String(to).trim()) {
        return;
    }

    const { rows = [] } = await pollRepository.getAll({});
    const groups = groupPollOptionsByListing(rows);
    const listingIds = groups.map((g) => g.listingId);
    const titleMap = await fetchListingTitlesMap(listingIds);
    const now = new Date();
    const generatedAtBerlin = formatTimeBerlin(now);
    const subject = `Aktualisierung der Feedback-Stimmen — ${generatedAtBerlin}`;
    const { plainText, html } = buildPollVoteReportEmailBodies({
        listingId,
        optionId,
        voteDelta,
        groups,
        titleMap,
        pollRows: rows,
        generatedAtBerlin,
    });

    await sendMail(String(to).trim(), subject, plainText, html, []);
}

const getAllListings = async (req, res, next) => {
    const params = req.query;
    const {
        pageNo = 1,
        pageSize = 9,
        sortByStartDate,
        statusId,
        subcategoryId,
        categoryId,
        cityId,
        translate,
        showExternalListings,
        startAfterDate,
        endBeforeDate,
        dateFilter
    } = params;
    const isAdmin = req.roleId === roles.Admin;
    try {
        const listings = await listingService.getAllListings({
            pageNo,
            pageSize,
            sortByStartDate,
            statusId,
            subcategoryId,
            categoryId,
            cityId,
            translate,
            showExternalListings,
            isAdmin,
            startAfterDate,
            endBeforeDate,
            dateFilter
        });
        res.status(200).json({
            status: "success",
            data: listings,
        });
    } catch (err) {
        next(err);
    }
};

const searchListings = async (req, res, next) => {
    const params = req.query;
    const {
        pageNo = 1,
        pageSize = 9,
        sortByStartDate,
        statusId,
        cityId,
        searchQuery,
    } = params;

    try {
        const listings = await listingService.searchListings({
            pageNo,
            pageSize,
            sortByStartDate,
            statusId,
            cityId,
            searchQuery,
        });

        res.status(200).json({
            status: "success",
            data: listings,
        });
    } catch (err) {
        next(err);
    }
};

const createListing = async (req, res, next) => {
    const { cityIds, ...listingData } = req.body;
    const { userId, roleId } = req;

    try {
        const newListing = await listingService.createListing({
            cityIds,
            listingData,
            userId,
            roleId,
        });
        if (req.version === "v0") {
            res.status(200).json({
                status: "success",
                id: newListing[0].listingId,
            });
        } else {
            res.status(200).json({
                status: "success",
                data: newListing,
            });
        }
    } catch (err) {
        next(err);
    }
};

const updateListing = async (req, res, next) => {
    const listingId = req.params.listingId;
    const { cityIds, ...listingData } = req.body;
    const { userId, roleId } = req;

    try {
        const updatedListing = await listingService.updateListing({
            listingId,
            cityIds,
            listingData,
            userId,
            roleId
        });

        res.status(200).json({
            status: "success",
            data: req.version && req.version === "v0" ? listingId : updatedListing,
            id: Number(listingId)
        });
    } catch (err) {
        next(err);
    }
};

const getListingWithId = async function (req, res, next) {
    const id = req.params.id;
    const repeatedRequest = req.repeatedRequest;

    try {
        const data = await listingService.getListingWithId(
            id,
            repeatedRequest
        );
        if (req.version === "v0") {
            if (data && data.otherlogos) {
                data.otherLogos = data.otherlogos;
            } else if (data && data.otherLogos) {
                data.otherlogos = data.otherLogos;
            }
        }
        return res.status(200).json({
            status: "success",
            data
        });
    } catch (err) {
        return next(err);
    }
};


const deleteListing = async function (req, res, next) {
    const id = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;
    try {
        await listingService.deleteListing(id, userId, roleId);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const uploadImage = async function (req, res, next) {
    const listingId = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;
    const imageFiles = req?.files?.image;
    const imageList = req?.body?.image;
    try {
        await listingService.uploadImage(
            listingId,
            userId,
            roleId,
            imageFiles,
            imageList
        );
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const uploadPDF = async function (req, res, next) {
    const listingId = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;
    const { pdf } = req.files;

    try {
        await listingService.uploadPDF(
            listingId,
            userId,
            roleId,
            pdf,
        );
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const deleteImage = async function (req, res, next) {
    const id = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;

    try {
        await listingService.deleteImage(
            id,
            userId,
            roleId,
        );
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const deletePDF = async function (req, res, next) {
    const id = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;

    try {
        await listingService.deletePDF(
            id,
            userId,
            roleId,
        );
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const vote = async function (req, res, next) {
    const listingId = req.params.id;
    const optionId = req.body.optionId;
    const voteDelta = req.body.vote;

    try {
        // const voteCount = await listingService.vote(
        //     listingId,
        //     optionId,
        //     voteDelta,
        // );

        sendPollVoteReportEmail({
            listingId,
            optionId,
            voteDelta,
        }).catch((err) => {
            console.error("Poll vote report email failed:", err);
        });

        return res.status(200).json({
            status: "success",
            votes: null,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getAllListings,
    searchListings,
    createListing,
    updateListing,
    getListingWithId,
    deleteListing,
    uploadImage,
    uploadPDF,
    deleteImage,
    deletePDF,
    vote
};