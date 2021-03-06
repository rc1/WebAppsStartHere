/* jshint esnext: true */

// WebApp
// ======
// An express server using jade, static files and a repl

// Modules
// =======
var http = require( 'http' );
var fs = require( 'fs' );
var path = require( 'path' );
var express = require( 'express' );
var serveStatic = require( 'serve-static' );
var W = require( 'w-js' );
var less = require( 'less' );
var repl = require( 'repl' );

// Make & Init
// ===========

function makeWebApp () {
    return {
        port: process.env.PORT || 9999,
        isLocal: W.isDefined( process.env.IS_LOCAL ) ? Boolean( process.env.IS_LOCAL ) : false
    };
}

var initWebApp = W.composePromisers( makeExpressApp,
                                     makeServer,
                                     makeRepl,
                                     W.makeReporter( 'OK', 'Server running.' ) );

initWebApp( makeWebApp() )
    .success( function ( app ) {
        W.report( 'OK', 'Listening on port:', app.port );
    })
    .error( function ( err ) {
        W.report( 'Error', 'Failed to create app' );
        throw err;
    });

// Promisers
// =========

function makeExpressApp ( app ) {
    return W.promise( function ( resolve, reject ) {

        app.expressApp = express();

        // Jade
        // ----
        app.expressApp.set( 'view engine', 'jade' );
        app.expressApp.set( 'views', path.join( __dirname, 'views' ) );
        if ( app.IS_LOCAL ) { app.expressApp.locals.pretty = true; }

        // Middleware
        // ----------

        // ### Static Files
        app.expressApp.use( serveStatic( path.join( __dirname, 'public' ) ) );

        // ### Errors
        app.expressApp.use( ( err, req, res, next ) => res.status( 500 ).send( '<pre>' + err  + '<pre>' ) );

        // Routes
        // ------
        
        // ### Home
        app.expressApp.get( '/', ( req, res ) => res.render( 'homepage', makeJadeData( app ) ) );
        

        // ### W.js Clientside
        app.expressApp.get( '/W.min.js', W.jsMinMiddleware() );
        
        resolve( app );
    });
}

function makeServer ( app ) {
    return W.promise( function ( resolve, reject ) {
        app.server = http.createServer( app.expressApp );
        app.server.listen( app.port );
        resolve( app );
    });
}

function makeRepl ( app ) {
    return W.promise( function ( resolve, reject ) {
        if ( app.isLocal ) {
            setTimeout( function () {
                var r = repl.start({
                            prompt: "REPL> ",
                            input: process.stdin,
                            output: process.stdout
                        });
                r.context.app = app;
            }, 1000 );
        }
        resolve( app );
    });
}

// Utils
// =====

// Jade
// ----

function makeJadeData ( app ) {
    return {
        isLocal: app.isLocal
    };
}
