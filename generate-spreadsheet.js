var async = require('async')
var fs = require('fs')
var csv = require('csv')
var util = require('util')

function pad (n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

async.parallel([
  function (cb) {
    var anoikis = require('./anoikis.json')
    var out = './anoikis.csv'
    var rows = []
    Object.keys(anoikis.systems).forEach(function (solarSystemName) {
      var system = anoikis.systems[solarSystemName]
      var JMatch = solarSystemName.match(/^J(\d{2})(\d{2})(\d{2}|[\-\+]\d)$/)
      var ra_dec = 0
      var h = m = s = '00'
      var isAnom = false
      if (JMatch) {
        h = JMatch[1]
        m = JMatch[2]
        s = JMatch[3]

        // anomalous "chopped" declination
        if (s.match(/^[\-\+]/)) {
          s = '00'
          isAnom = true
        }

        var numSec = Number(s)
        if (numSec > 59) {
          var newSec = numSec - 60
          s = pad(newSec, 2)
          m = pad(Number(m) + 1, 2)
          isAnom = true
        }
        var numMin = Number(m)
        if (numMin > 59) {
          var newMin = numMin - 60
          m = pad(newMin, 2)
          h = pad(Number(h) + 1, 2)
          isAnom = true
        }
        var numHour = Number(h)
        if (numHour > 23) {
          var newHour = numHour - 24
          h = pad(newHour, 2)
          isAnom = true
        }
        ra_dec = (Number(h) * 15) + (Number(m) * (15/60)) + (Number(s) * (15/60/60))
      }

      var colour = 'rgb(100,100,100)'

      var status = ''
      var dec_text = ''
      var dec_dec = 0
      switch (solarSystemName) {
        case 'J055520':
          // SENTINEL
          dec_dec = 7.2425
          status = 'FOUND'
          break;
        case 'J164710':
          // VIDETTE
          dec_dec = -31.93
          status = 'FOUND'
          break;
      }
      rows.push({
        solarSystemName: solarSystemName,
        solarSystemID: system.solarSystemID,
        regionID: system.regionID,
        constellationID: system.constellationID,
        wormholeClass: system.wormholeClass.toUpperCase(),
        systemEffect: system.effectName,
        hour: Number(h),
        minute: Number(m),
        second: Number(s),
        RAText: util.format('%sh %sm %ss', h, m, s),
        RADec: ra_dec,
        isAnom: isAnom ? 'YES' : '',
        status: status,
        href: '',
        notes: ''
      })
    })

    console.log('found', rows.length, 'J-systems')
    rows.sort(function (a, b) {
      if (a.RADec < b.RADec) {
        return -1
      }
      else if (a.RADec > b.RADec) {
        return 1
      }
      return 0
    })
    csv.stringify(rows, {
      columns: [
        { key: 'solarSystemName' },
        { key: 'solarSystemID' },
        { key: 'regionID' },
        { key: 'constellationID' },
        { key: 'wormholeClass' },
        { key: 'systemEffect' },
        { key: 'hour' },
        { key: 'minute' },
        { key: 'second' },
        { key: 'RAText' },
        { key: 'RADec' },
        { key: 'isAnom' },
        { key: 'status' },
        { key: 'href' },
        { key: 'notes' }
      ],
      header: true
    }, function(err, str) {
      if (err) return cb(err)
      fs.writeFileSync(out, str)
      console.log('wrote', out)
      cb()
    });
  }
], function (err) {
  if (err) throw err
  console.log('done')
})
