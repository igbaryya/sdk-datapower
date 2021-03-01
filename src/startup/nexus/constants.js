module.exports = {
    nexusPath:     
    {
        // path to Nexus
        src: '${HOST}/nexus/content/groups/${VERSION_A}-Public/${ARTIFACT}/${VERSION_B}-SNAPSHOT/${FILE}',
        trg: '${ARTIFACT}-meta.xml',
        tokens: ['HOST', 'ARTIFACT', 'VERSION_A', 'VERSION_B', 'FILE']
    },
    files: [
        {
            name: 'jar-name',
            src: 'jsons-jar-name-${SNAPSHOT_VERSION}.zip',   
            trg: 'jar-name-after-download.zip'
        }
    ],
    meta: 
    {
        name: 'maven-metadata.xml',
        src: 'maven-metadata.xml',
        trg: '${ARTIFACT}-meta.xml'
    },
    mappingFile: 'dpMapper.json',
    downloadPath: 'nexusDownloadedJsons/',
    UTF8: 'utf8', 
    snapshotVersion: 'SNAPSHOT_VERSION',
    versionA: 'VERSION_A',
    versionB: 'VERSION_B',
    host: 'HOST',
    artifact: 'ARTIFACT',
    file: 'FILE',
    in: 'in',
    body: 'body',
    ref: '$ref',
    // Not to delete below JSONs
    blacklistJsons: [
        'dpMapper.json'
    ]
}