const ScwApi = require('./api');
const fs = require('fs');

class Scaleway {
  constructor(options) {
    this._options = options;
    this._scw = new ScwApi({
      token: this._options.token,
      api_endpoint: 'https://cp-' +  (this._options.region || 'par1') + '.scaleway.com/'
    });

    this._servers = null;
    this._images = null;
    this._organizations = null;
  }

  server_getById(id) {
    let servers = []
    for (let server of this._servers) {
      if (server.id.match(id)) {
        servers.push(server);
      }
    }

    if (servers.length === 0 || servers.length > 1) {
      return null;
    }

    return servers[0];
  }

  ps() {
    return new Promise( (resolve, reject) => {
      this._scw.get('/servers', (err, res) => {
        if (!err) {
          this._servers = JSON.parse(res.text).servers;
          resolve(this._servers);
        } else {
          reject(err);
        }
      });
    });
  }

  server_create(serverInfo) {
    return new Promise( (resolve, reject) => {
      this.image_getByName(serverInfo.image).then( image => {
        serverInfo.image = image.id;
        this._scw.post('/servers', serverInfo, (err, res) => {
          if (!err) {
            resolve(JSON.parse(res.text).server);
          } else {
            reject(err);
          }
        });
      }).catch(err => {
        reject(err);
      });
    });
  }

  server_start(id, timeout) {
    return new Promise( (resolve, reject) => {
      this._scw.post('/servers/' + id + '/action', { action: 'poweron' }, (err, res) => {
        if (!err) {
          if (timeout) {
            this.server_wait(id, 'running', timeout).then( server => {
              resolve(server);
            }).catch(err => reject(err));
          } else {
            this.server_inspect(id).then( server => {
              resolve(server);
            }).catch(err => reject(err));
          }
        } else {
          reject('server not available or not startable');
        }
      });
    });
  }

  server_stop(id, timeout) {
    return new Promise( (resolve, reject) => {
      this._scw.post('/servers/' + id + '/action', { action: 'poweroff' }, (err, res) => {
        if (!err) {
          if (timeout) {
            this.server_wait(id, 'stopped', timeout).then( server => {
              resolve(server);
            }).catch(err => reject(err));
          } else {
            this.server_inspect(id).then( server => {
              resolve(server);
            }).catch(err => reject(err));
          }
        } else {
          reject('server not available or not stoppable');
        }
      });
    });
  }

  server_remove(id) {
    return new Promise( (resolve, reject) => {
      this._scw.delete('/servers/' + id, (err, res) => {
        if (!err) {
          resolve();
        } else {
          reject('server not available or cannot be removed');
        }
      });
    });
  }

  server_inspect(id) {
    return new Promise( (resolve, reject) => {
      this._scw.get('/servers/' + id, (err, res) => {
        if (!err) {
          resolve(JSON.parse(res.text).server);
        } else {
          reject('server not available');
        }
      });
    });
  }

  server_wait(id, state, timeout) {
    timeout = timeout || 120000;

    return new Promise( (resolve, reject) => {
      let checkTimeout;

      let checkInterval = setInterval( () => {
        this.server_inspect(id).then( server => {
          if (server.state === state) {
            clearInterval(checkInterval);
            clearTimeout(checkTimeout); // nothing if undefined

            resolve(server);
          }
        }).catch( err => {
          reject(err);
        })
      }, 1000);

      checkTimeout = setTimeout( () => {
        if (checkInterval) {
          clearInterval(checkInterval);
          reject('Timeout: server not available after ' + timeout/1000 + 'sec');
        }
      }, timeout);
    });
  }

  image_inspect(id) {
    return new Promise( (resolve, reject) => {
      this._scw.get('/images/' + id, (err, res) => {
        if (!err) {
          resolve(JSON.parse(res.text).image);
        } else {
          reject(err);
        }
      });
    });
  }

  image_list() {
    return new Promise( (resolve, reject) => {
      this._scw.get('/images/', (err, res) => {
        if (!err) {
          this._images = JSON.parse(res.text).images;
          resolve(this._images);
        } else {
          reject(err);
        }
      });
    });
  }

  image_getByName(name) {
    return new Promise( (resolve, reject) => {
      this.image_list().then( images => {
        for (let image of images) {
          if (image.name === name) {
            resolve(image);
            return;
          }
        }

        reject('image not found');
      }).catch(err => {
        reject(err);
      });
    });
  }

  play(playbook) {
    try {
      if (typeof playbook === 'function') {
        playbook.call(this);
      } else {
        throw new Error('playbook must be a callable function');
      }
    } catch(err) {
      console.log('play failed: ', err);
    }
  }
}

module.exports = Scaleway;
