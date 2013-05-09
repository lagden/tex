'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      frameworks: {
        src: [
          'js/vendor/mootools/*.js',
          'components/jquery/jquery.js'
        ],
        dest: 'js/dist/frameworks.js'
      },
      others: {
        src: [
          'js/vendor/greensock/src/uncompressed/plugins/CSSPlugin.js',
          'js/vendor/greensock/src/uncompressed/plugins/ScrollToPlugin.js',
          'js/vendor/greensock/src/uncompressed/plugins/easing/EasePack.js',
          'js/vendor/greensock/src/uncompressed/TweenMax.js',
          'js/vendor/greensock/src/uncompressed/jquery.gsap.js',
          'components/jquery-placeholder/jquery.placeholder.js'
        ],
        dest: 'js/dist/others.js'
      },
      app: {
        src: [
          'js/plugins.js',
          'js/main.js'
        ],
        dest: 'js/dist/base.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */',
        properties: true,
        compress: {
          global_defs: {
            "DEBUG": false
          },
          dead_code: true
        },
        beautify: {
          width: 80,
          beautify: true
        }
      },
      target: {
        files: {
          'js/min/output.min.js': ['js/dist/frameworks.js', 'js/dist/others.js', 'js/dist/base.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['concat', 'uglify']);

};
