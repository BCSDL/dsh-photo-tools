import test from 'node:test';import assert from 'node:assert/strict';import {registerPhotoTools} from '../lib/photo-tools.js';
test('real DSH schema compiles and only the photo tool is registered',()=>{const tools=[];registerPhotoTools({effect:f=>f(),tools:{register:d=>{tools.push(d);return ()=>{};}}},{});assert.deepEqual(tools.map(x=>x.name),['photo_catalog']);});
