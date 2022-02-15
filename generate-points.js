var sqlite3 = require('sqlite3')
var async = require('async')
var fs = require('fs')

function pad (n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

async.series([
  function (cb) {
    var out = './wolf-rayet.json'
    var points = []
    var hip = new sqlite3.Database('hip.sqlite')
    hip.each("SELECT * FROM hipparcos_full WHERE SpType LIKE 'W%'", function (err, row) {
      if (err) return
      points.push({
        target: {
          name: 'W' + points.length
        },
        ra: {
          decimal: row.RAdeg
        },
        dec: {
          decimal: row.DEdeg
        },
        html: '<a href="https://simbad.u-strasbg.fr/simbad/sim-id?Ident=HIP+' + row.HIP + '" target="_blank">HIP ' + row.HIP + '</a>'
      })
    }, function (err, count) {
      if (err) return cb(err)
      console.log('found', points.length, 'Wolf-Rayet stars')
      var str = JSON.stringify(points, null, 2)
      fs.writeFileSync(out, str)

      console.log('wrote', out)
      cb()
    })
  },
  function (cb) {
    var out = './j-numbers.json'
    var anoikis = require('./anoikis.json')
    var points = []

    Object.keys(anoikis.systems).forEach(function (solarSystemName) {
      var JMatch = solarSystemName.match(/^J(\d{2})(\d{2})(\d{2}|[\-\+]\d)$/)
      if (!JMatch) {
        return
      }

      var h = JMatch[1]
        , m = JMatch[2]
        , s = JMatch[3]

      // anomalous "chopped" declination
      if (s.match(/^\-\+/)) {
        s = '00'
      }

      var numSec = Number(s)
      if (numSec > 59) {
        var newSec = numSec - 60
        s = pad(newSec, 2)
        m = pad(Number(m) + 1, 2)
      }
      var numMin = Number(m)
      if (numMin > 59) {
        var newMin = numMin - 60
        m = pad(newMin, 2)
        h = pad(Number(h) + 1, 2)
      }
      var numHour = Number(h)
      if (numHour > 23) {
        var newHour = numHour - 24
        h = pad(newHour, 2)
      }

      points.push({
        target: {
          name: 'J' + points.length
        },
        ra: {
          decimal: (Number(h) * 15) + (Number(m) * (15/60)) + (Number(s) * (15/60/60))
        },
        dec: {
          decimal: 0
        },
        html: '<a href="http://anoik.is/systems/' + solarSystemName + '" target="_blank">' + solarSystemName + '</a>'
      })
    })

    console.log('found', points.length, 'J-systems')
    var str = JSON.stringify(points, null, 2)
    fs.writeFileSync(out, str)

    console.log('wrote', out)
    cb()
  }
], function (err) {
  if (err) throw err
  console.log('done')
})
