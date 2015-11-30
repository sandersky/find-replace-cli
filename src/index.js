'use strict'

/**
 * @typedef Object Transform
 * @property {String} from - string/pattern to search for in files
 * @property {String} to - string/pattern to replace 'from' value with
 * @property {Boolean} regex - whether or not to use regex replace
 */

/**
 * @typedef Object Configuration
 * @property {String[]} files - globs for files to match
 * @property {Transform[]} transforms - transforms to apply
 */

const fsp = require('fs-promise')
const glob = require('glob-all')

module.exports = {
  /**
   * Apply transform to contents
   *
   * @param {String} contents - contents to transform
   * @param {Transform} transform - transform to apply
   */
  _applyTransform(contents, transform) {
    const flags = (transform.global === false ? '' : 'g')

    if (transform.regex) {
      const pattern = new RegExp(transform.from, flags)
      return contents.replace(pattern, transform.to)
    }

    return contents.split(transform.from).join(transform.to)
  },

  /**
   * Get all file paths based on config file globs
   *
   * @param {String} dir - directory to apply transforms withi];/;\
  
  
   * @param {Configuration} config - configuration
   * @returns {Promise} resolve with file paths or rejects with error(s)
   */
  _getFilePaths(dir, config) {
    const options = {
      cwd: dir
    }

    return new Promise((resolve, reject) => {
      glob(config.files, options, (err, filePaths) => {
        if (err) {
          reject(err)
          return
        }

        resolve(filePaths)
      })
    })
  },

  /**
   * Save contents to file
   *
   * @param {String} filePath - file path to save contents to
   * @param {String} contents - contents to save to file
   * @returns {Promise} resolves once saved or rejects with error(s)
   */
  _saveFileContents(filePath, contents) {
    return fsp.writeFile(filePath, contents)
  },

  /**
   * Apply transforms to file
   *
   * @param {String} filePath - path to file to transform
   * @param {Transform[]} transforms - transforms to apply to file
   * @returns {Promise} resolves when transform is complete or rejects with error(s)
   */
  _transformFile(filePath, transforms) {
    return fsp.readFile(filePath)
      .then(buffer => {
        let contents = buffer.toString()

        transforms.forEach(transform => {
          contents = this._applyTransform(contents, transform)
        })

        return contents
      })
      .then(this._saveFileContents.bind(this, filePath))
  },

  /**
   * Apply transforms to files
   *
   * @param {Configuration} config - configuration
   * @param {String[]} filePaths - paths of files to transform
   */
  _transformFiles(config, filePaths) {
    const promises = []

    filePaths.forEach(filePath => {
      promises.push(
        this._transformFile(filePath, config.transforms)
      )
    })

    return Promise.all(promises)
  },

  /**
   * Validate transform configuration
   *
   * @param {Configuration} config - configuration to validate
   * @returns {Promise} resolves if valid otherwise rejects with appropriate error(s)
   */
  _validateConfig(config) {
    const errors = []

    this._validateFilesProperty(config, errors)
    this._validateTransformsProperty(config, errors)

    if (errors.length !== 0) {
      return Promise.reject(errors)
    }

    return Promise.resolve()
  },

  /**
   * Validate configuration property 'files'
   *
   * @param {Configuration} config - configuration to validate 'files' property of
   * @param {String[]} errors - array for method to push errors to
   */
  _validateFilesProperty(config, errors) {
    if (config.files === undefined) {
      errors.push('"files" property missing')
      return
    }

    if (!Array.isArray(config.files)) {
      errors.push('"files" property should be an array')
      return
    }

    // TODO: validate each file glob
  },

  /**
   * Validate configuration property 'transforms'
   *
    * @param {Configuration} config - configuration to validate 'transforms' property of
   * @param {String[]} errors - array for method to push errors to
   */
  _validateTransformsProperty(config, errors) {
    if (config.transforms === undefined) {
      errors.push('"transforms" property missing')
      return
    }

    if (!Array.isArray(config.transforms)) {
      errors.push('"transforms" property should be an array')
      return
    }

    // TODO: validate each transform
  },

  /**
   * Load configuration file
   *
   * @param {String} path - path to configuration file
   * @returns {Promise} resolves with contents of file or rejects with appropriate error
   */
  loadConfigFile(path) {
    return fsp.readFile(path)
      .then(contents => {
        try {
          return JSON.parse(contents)
        } catch (err) {
          throw new Error(`Failed to parse contents of '${ path }' as JSON`)
        }
      })
      .catch(err => {
        if (err.code === 'ENOENT' && err.errno === -2) {
          throw new Error(`Failed to open file '${ path }'`)
        }

        throw err
      })
  },

  /**
   * Transform files based on user configuration
   *
   * @param {String} dir - directory to apply transforms within
   * @param {Configuration} config - user configuration
   * @returns {Promise} promise that rejects if/when an error occurs trying to apply transforms
   */
  transform(dir, config) {
    return fsp.exists(dir)
      .then(exists => {
        if (!exists) {
          throw new Error(`Directory '${ workingDir }' does not exist`)
        }
      })
      .then(this._validateConfig.bind(this, config))
      .then(this._getFilePaths.bind(this, dir, config))
      .then(this._transformFiles.bind(this, config))
  },
}
