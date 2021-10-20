console.log('START')
setTimeout(() => console.log('END'), 10000)
class streamTransform extends require('stream').Transform {
  _transform (chunk, encoding, callback) {
    // this.push(chunk)
    console.log('netClientMultiStream _transform', { chunk, encoding })
    callback()
  }
}
class streamDuplex extends require('stream').Duplex {
  _write (chunk, encoding, callback) {
    this.push(chunk)
    console.log('streamDuplex _write', { chunk, encoding })
    callback()
  }
  _read (chunk) {
    console.log('streamDuplex _chunk', { chunk })
  }
}
class streamDuplex2 extends require('stream').Duplex {
  _write (chunk, encoding, callback) {
    console.log('streamDuplex2 _write', { chunk, encoding })
    callback()
  }
  _read (chunk) {
    console.log('streamDuplex2 _chunk', { chunk})
  }
}
var streamDuplexItem = new streamDuplex({objectMode: true, writableObjectMode: true, readableObjectMode: true})
var streamDuplex2Item = new streamDuplex2({objectMode: true, writableObjectMode: true, readableObjectMode: true})
streamDuplex2Item.push({'data': 'test'})
streamDuplex2Item.pipe(streamDuplexItem)
