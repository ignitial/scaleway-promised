# Simple Promise based access to Scaleway API.

Based on [scaleway](https://github.com/moul/node-scaleway.git) by
[Manfred Touron](https://github.com/moul).

## Available API functions

- _ps_: list servers
- _server_getById_: needs _ps_ to have been executed just before
- _server_create(data)_: creates a server with data as per below:
```javascript
{
    organization: '12345678-1234-1234-1234-012345678901',
    name: 'server_name',
    image: 'image_id',
    commercial_type: 'VC1S || any availabale types -> see Scaleway CLI doc'
}
```
- _server_start(id[, timeout])_
- _server_stop(id[, timeout])_
- _server_remove(id)_
- _server_inspect(id)_
- _server_wait(id, state[, timeout])_: wait for server to be in a specific state
- _image_inspect(id)_
- _image_list()_
- _image_getByName(name)_

## TODO

- implement all missing functions
