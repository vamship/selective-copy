'use strict';

const _folder = require('wysknd-lib').folder;
const _utils = require('wysknd-lib').utils;

// -------------------------------------------------------------------------------
//  Help documentation
// -------------------------------------------------------------------------------
/*esfmt-ignore-start*/
const HELP_TEXT =
'--------------------------------------------------------------------------------\n' +
' Defines tasks that are commonly used during the development process. This      \n' +
' includes tasks for linting, building and testing.                              \n' +
'                                                                                \n' +
' Supported Tasks:                                                               \n' +
'   [default]         : Performs standard pre-checkin activities. Runs           \n' +
'                       formatting on all source files, validates the files      \n' +
'                       (linting), and then executes tests against the files.    \n' +
'                                                                                \n' +
'   env               : Provides information regarding the current environment.  \n' +
'                       This an information only task that does not alter any    \n' +
'                       file/folder in the environment.                          \n' +
'                                                                                \n' +
'   help              : Shows this help message.                                 \n' +
'                                                                                \n' +
'   clean             : Cleans out all build artifacts and other temporary files \n' +
'                       or directories.                                          \n' +
'                                                                                \n' +
'   monitor:[<opt1>]: : Monitors files for changes, and triggers actions based   \n' +
'           [<opt2>]:   on specified options. Supported options are as follows:  \n' +
'           [<opt3>]     [lint]    : Performs linting with default options       \n' +
'                                    against all source files.                   \n' +
'                        [unit]    : Executes unit tests against all source      \n' +
'                                    files.                                      \n' +
'                                                                                \n' +
'                       Multiple options may be specified, and the triggers will \n' +
'                       be executed in the order specified. If a specific task   \n' +
'                       requires a web server to be launched, this will be done  \n' +
'                       automatically.                                           \n' +
'                                                                                \n' +
'   lint              : Performs linting of all source and test files.           \n' +
'                                                                                \n' +
'   format            : Formats source and test files.                           \n' +
'                                                                                \n' +
'   test:[unit]       : Executes unit tests against source files.                \n' +
'                                                                                \n' +
'   bump:[major|minor]: Updates the version number of the package. By default,   \n' +
'                       this task only increments the patch version number. Major\n' +
'                       and minor version numbers can be incremented by          \n' +
'                       specifying the "major" or "minor" subtask.               \n' +
'                                                                                \n' +
' Supported Options:                                                             \n' +
'   --test-suite      : Can be used to specify a unit test suite to execute when \n' +
'                       running tests. Useful when development is focused on a   \n' +
'                       small section of the app, and there is no need to retest \n' +
'                       all components when runing a watch.                      \n' +
'                                                                                \n' +
' IMPORTANT: Please note that while the grunt file exposes tasks in addition to  \n' +
' ---------  the ones listed below (no private tasks in grunt yet :( ), it is    \n' +
'            strongly recommended that just the tasks listed below be used       \n' +
'            during the dev/build process.                                       \n' +
'                                                                                \n' +
'--------------------------------------------------------------------------------';
/*esfmt-ignore-end*/

module.exports = function(grunt) {
    /* ------------------------------------------------------------------------
     * Initialization of dependencies.
     * ---------------------------------------------------------------------- */
    //Time the grunt process, so that we can understand time consumed per task.
    require('time-grunt')(grunt);

    //Load all grunt tasks by reading package.json.
    require('load-grunt-tasks')(grunt);

    /* ------------------------------------------------------------------------
     * Build configuration parameters
     * ---------------------------------------------------------------------- */
    const packageConfig = grunt.file.readJSON('package.json') || {};

    const ENV = {
        appName: packageConfig.name || '__UNKNOWN__',
        appVersion: packageConfig.version || '__UNKNOWN__',
    /*esfmt-ignore-start*/
        tree: {                             /* ------------------------------ */
                                            /* <ROOT>                         */
            'src': null,                    /*  |--- src                      */
            'test': {                       /*  |--- test                     */
                'unit': null                /*  |   |--- unit                 */
            },                              /*  |                             */
            'resources': {                  /*  |--- resources                */
                'core': null,               /*  |    | --- core               */
                'api': null,                /*  |    | --- api                */
                'dev': null,                /*  |    | --- dev                */
                'qa': null,                 /*  |    | --- qa                 */
                'prod': null                /*  |    | --- prod               */
            },                              /*  |                             */
            'working': null,                /*  |--- working                  */
            'coverage': null                /*  |--- coverage                 */
        }                                   /* ------------------------------ */
    /*esfmt-ignore-end*/
    };

    ENV.ROOT = _folder.createFolderTree('./', ENV.tree);

    (function _createTreeRefs(parent, subTree) {
        for (let folder in subTree) {
            const folderName = folder.replace('.', '_');
            parent[folderName] = parent.getSubFolder(folder);

            const children = subTree[folder];
            if (typeof children === 'object') {
                _createTreeRefs(parent[folder], children);
            }
        }
    })(ENV.ROOT, ENV.tree);

    // Shorthand references to key folders.
    const SRC = ENV.ROOT.src;
    const TEST = ENV.ROOT.test;
    const WORKING = ENV.ROOT.working;
    const RESOURCES = ENV.ROOT.resources;

    /* ------------------------------------------------------------------------
     * Grunt task configuration
     * ---------------------------------------------------------------------- */
    grunt.initConfig({
        /**
         * Configuration for grunt-contrib-clean, which is used to:
         *  - Remove temporary files and folders.
         */
        clean: {
            coverage: [ENV.ROOT.coverage.getPath()],
            working: [WORKING.getPath()]
        },

        /**
         * Configuration for grunt-mocha-istanbul, which is used to:
         *  - Execute server side node.js tests, with code coverage
         */
        mocha_istanbul: {
            options: {
                reportFormats: ['text', 'html'],
                reporter: 'spec',
                colors: true
            },
            unit: [TEST.unit.allFilesPattern('js')]
        },

        /**
         * Configuration for grunt-esformatter, which is used to:
         *  - Format javascript source code
         */
        esformatter: {
            options: {
                plugins: [
                    'esformatter-ignore',
                    'esformatter-remove-trailing-commas'
                ]
            },
            src: [
                'Gruntfile.js',
                SRC.allFilesPattern('js'),
                RESOURCES.allFilesPattern('js'),
                TEST.allFilesPattern('js')
            ]
        },

        /**
         * Configuration for grunt-eslint, which is used to:
         *  - Lint source and test files.
         */
        eslint: {
            dev: [
                'Gruntfile.js',
                SRC.allFilesPattern('js'),
                RESOURCES.allFilesPattern('js'),
                TEST.allFilesPattern('js')
            ]
        },

        /**
         * Configuration for grunt-contrib-watch, which is used to:
         *  - Monitor all source/test files and trigger actions when these
         *    files change.
         */
        watch: {
            allSources: {
                files: [SRC.allFilesPattern(), TEST.allFilesPattern()],
                tasks: []
            }
        },

        /**
         * Configuration for grunt-bump, which is used to:
         *  - Update the version number on package.json
         */
        bump: {
            options: {
                push: false
            }
        }
    });

    /* ------------------------------------------------------------------------
     * Task registrations
     * ---------------------------------------------------------------------- */

    /**
     * Default task. Performs default tasks prior to checkin, including:
     *  - Beautifying files
     *  - Linting files
     *  - Building sources
     *  - Testing build artifacts
     *  - Cleaning up build results
     */
    grunt.registerTask('default', [
        'format',
        'lint',
        'test:unit',
        'clean']);

    /**
     * Test task - executes lambda tests against code in dev only.
     */
    grunt.registerTask('test',
        'Executes tests against sources',
        function(testType) {
            testType = testType || 'unit';
            let testAction;

            if (['unit'].indexOf(testType) >= 0) {
                testAction = `mocha_istanbul:${testType}`;
                const testSuite = grunt.option('test-suite');
                if (typeof testSuite === 'string' && testSuite.length > 0) {
                    const suitePath = TEST.unit.getChildPath(testSuite);
                    grunt.log.writeln(`Running test suite: [${testSuite}], Path: [${suitePath}]`);
                    grunt.config.set(`mocha_istanbul.${testType}`, suitePath);
                }
            }

            if (testAction) {
                grunt.task.run(testAction);
            } else {
                grunt.log.warn('Unrecognized test type. Please see help (grunt help) for task usage information');
            }
        }
    );

    // Monitor task - track changes on different sources, and enable auto
    // execution of tests if requested.
    //  - If arguments are specified (see help) execute the necessary actions
    //    on changes.
    grunt.registerTask('monitor',
        'Monitors source files for changes, and performs actions as necessary',
        function() {
            const tasks = [];

            // Process the arguments (specified as subtasks).
            Array.prototype.slice.call(arguments).forEach((arg) => {
                if (arg === 'lint') {
                    tasks.push('lint');

                } else if (arg === 'unit') {
                    tasks.push('test:unit');

                } else {
                    // Unrecognized argument.
                    grunt.log.warn('Unrecognized argument: %s', arg);
                }
            });

            if (tasks.length > 0) {
                grunt.config.set('watch.allSources.tasks', tasks);
                grunt.log.writeln('Tasks to run on change: [' + tasks + ']');
                grunt.task.run('watch:allSources');
            } else {
                grunt.log.writeln('No tasks specified to execute on change');
            }
        }
    );

    /**
     * Shows the environment setup.
     */
    grunt.registerTask('env',
        'Shows the current environment setup',
        function() {
            const separator = new Array(80).join('-');
            function _showRecursive(root, indent) {
                let indentChars = '  ';
                if (!indent) {
                    indent = 0;
                } else {
                    indentChars += '|';
                }
                indentChars += new Array(indent).join(' ');
                indentChars += '|--- ';
                let hasChildren = false;
                for (let prop in root) {
                    const member = root[prop];
                    if (typeof member === 'object') {
                        const maxLen = 74 - (indentChars.length + prop.length);
                        const status = _utils.padLeft(member.getStatus(), maxLen);

                        grunt.log.writeln(indentChars + prop + status);
                        hasChildren = true;
                        if (_showRecursive(member, indent + 4)) {
                            grunt.log.writeln('  |');
                        }
                    }
                }

                return hasChildren;
            }

            grunt.log.writeln('\n' + separator);
            _showRecursive(ENV.ROOT, 0);
            grunt.log.writeln(separator + '\n');
        }
    );

    /**
     * Lint task - checks source and test files for linting errors.
     */
    grunt.registerTask('lint', ['eslint:dev']);

    /**
     * Formatter task - formats all source and test files.
     */
    grunt.registerTask('format', ['esformatter']);

    /**
     * Shows help information on how to use the Grunt tasks.
     */
    grunt.registerTask('help',
        'Displays grunt help documentation',
        function() {
            grunt.log.writeln(HELP_TEXT);
        }
    );
};
