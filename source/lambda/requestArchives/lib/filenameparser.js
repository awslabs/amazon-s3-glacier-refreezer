// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * @author Solution Builders
 */

"use strict";

const { XMLParser } = require("fast-xml-parser");
const parser = new XMLParser();

function parseFileName(archiveId, archiveDescription) {
    let fname = detectAndParseDescription(archiveDescription.trim()).trim();

    // Empty file names: using archiveId
    if (fname === "") {
        console.log(`Empty filename in Archive Description: ${archiveDescription} for ${archiveId}`);
        console.log(`Restoring as "00undefined/${archiveId}"`);
        fname += `00undefined/${archiveId}`;
    }

    // [ Windows slash format (backward)]
    if (fname.includes("\\")) {
        fname = fname.replace(/\\/g, "/");
    }

    return fname;
}

function detectAndParseDescription(archiveDescription) {
    // [ FAST GLACIER v 2,3,4 ]
    if (archiveDescription.match(/<m>.*<\/m>/m)) {
        return parseFastGlacier(archiveDescription, "m", "p");
    }

    // [ FAST GLACIER v 1 ]
    if (archiveDescription.match(/<ArchiveMetadata>.*<\/ArchiveMetadata>/m)) {
        return parseFastGlacier(archiveDescription, "ArchiveMetadata", "Path");
    }

    // [ JSON ]
    if (archiveDescription.match(/{\s*\\*\".*}\s*/)) {
        try {
            let jsonObject = JSON.parse(archiveDescription);
            if (typeof jsonObject === "string") jsonObject = JSON.parse(jsonObject);

            // [ CLOUD BERRY ]
            if (jsonObject.hasOwnProperty("Path")) return jsonObject.Path;
        } catch (err) {
            console.warn(`Failed to parse JSON: ${archiveDescription}`);
            console.warn(`Err:  ${err}`);
        }
    }

    return archiveDescription;
}

function parseFastGlacier(archiveDescription, metadata, path) {
    const jsonObj = parser.parse(archiveDescription);
    return Buffer.from(jsonObj[metadata][path], "base64").toString("ascii");
}

module.exports = {
    detectAndParseDescription,
    parseFileName,
};
