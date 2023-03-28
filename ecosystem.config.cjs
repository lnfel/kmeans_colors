/**
 * PM2 config
 * 
 * https://pm2.keymetrics.io/docs/usage/application-declaration/
 * 
 * Use PM2 to run sveltekit node server
 * https://stackoverflow.com/questions/75120626/pm2-run-nodejs-sveltekit-app-with-options
 * 
 * Use module.exports
 * https://stackoverflow.com/questions/71825361/pm2-ecosystem-file-pm2error-file-ecosystem-config-js-malformated
 * 
 * PM2 setup
 * https://abyteofcoding.com/blog/deploying-sveltekit-with-nodejs-pm2-to-server/
 */

module.exports = {
    apps : [
        {
            name: "kmeans_colors",
            script: "build/index.js",
            // This one also works but setting the env dynamically is preferred
            // script: "ORIGIN=http://localhost:3000 BODY_SIZE_LIMIT=0 node build",
            /**
             * Do not enable watch, since it breaks kmeans_colors main functionality,
             * enabling watch will make pm2 attempt to restart the server when a change is detected,
             * like when we add a file, which we do when we try to upload a file.
             * The restart calls SIGINT TERM and we get err::connection refused on client side.
             */
            // watch: true,
            error_file: "./storage/log/error.log",
            out_file: "./storage/log/app.log",
            env: {
                NODE_ENV: 'development',
                PORT: 3000,
                ORIGIN: "http://localhost:3000",
                BODY_SIZE_LIMIT: 0
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
                ORIGIN: "http://www-staging.pingsailor.com",
                BODY_SIZE_LIMIT: 0
            },
        }
    ]
}
