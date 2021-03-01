module.exports = {
    server: {
        port: 40004
    },
    endpoint: {
        host: 'ENTER_HOST', // Enter here the target host. Example: server1.com
        port: 8080 // Server Port 
    },
    /**
     * Nexus JSONs Download Timeout in milisecond
     */
    downloadTimeout: 5000,
    /**
     * @param {string} api API path to bypass 
     * @param {methods} api method types to bypass (splitted by comma ",")
     * example: {api: "/server/apiToBypass", methods: "post, put"}
     * @description To by pass all requests, Apply: {api: "*", methods: "*"}
     */
    whitelistApis: [],
    continueWithInvalidJson: false, 
    passAPIOnFailure: false,
    httpMethods: {
        get: {
            name: 'GET',
            desc: 'The GET method is used to retrieve information from the given server using a given URI. Requests using GET should only retrieve data and should have no other effect on the data.',
            payloadless: true
        },
        head: {
            name: 'HEAD',
            desc: 'Same as GET, but transfers the status line and header section only.',
            payloadless: true
        },
        post: {
            name: 'POST',
            desc: 'A POST request is used to send data to the server, for example, customer information, file upload, etc. using HTML forms.',
            payloadless: false
        },
        put: {
            name: 'PUT',
            desc: 'Replaces all current representations of the target resource with the uploaded content.',
            payloadless: false
        },
        delete: {
            name: 'DELETE',
            desc: 'Removes all current representations of the target resource given by a URI.',
            payloadless: true
        },
        connect: {
            name: 'CONNECT',
            desc: 'Establishes a tunnel to the server identified by a given URI.',
            payloadless: true
        },
        options: {
            name: 'OPTIONS',
            desc: 'Describes the communication options for the target resource.',
            payloadless: true
        },
        trace: {
            name: 'TRACE',
            desc: 'Performs a message loop-back test along the path to the target resource.',
            payloadless: true
        }
    }
}
