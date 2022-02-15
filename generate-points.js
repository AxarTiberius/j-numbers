var sqlite3 = require('sqlite3')
var async = require('async')
var fs = require('fs')
var hip = new sqlite3.Database('hip.sqlite')
var csv = require('csv')

function pad (n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

async.parallel([
  function (cb) {
    var parser = csv.parse({
      columns: true
    })
    var csvStream = fs.createReadStream('./objects.csv', {flags: 'r'})
    var i = 0
    var rows = [], points = []
    var out = './custom-objects.json'
    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        rows.push(record)
      }
    });
    parser.on('end', function () {
      rows.forEach(function (row) {
        points.push({
          target: {
            name: 'O' + points.length
          },
          ra: {
            decimal: Number(row.ra_dec)
          },
          dec: {
            decimal: 2
            // decimal: row.DEdeg
          },
          html: '<a href="' + row.url + '" target="_blank">' + row.name + '</a> (' + row.type + ')',
          colour: 'rgb(179,0,255)'
        })
      })
      console.log('found', points.length, 'Custom objects')
      var str = JSON.stringify(points, null, 2)
      fs.writeFileSync(out, str)
      console.log('wrote', out)
      cb()
    })
    parser.once('error', function(err) {
      cb(err);
    });
    csvStream.on('end', function () {
      parser.end()
    })
    csvStream.pipe(parser)
  },
  function (cb) {
    var out = './red-giant.json'
    var points = []
    hip.each("SELECT HIP, RAhms, DEdms, RAdeg, DEdeg, VMag, HvarType, CCDM, SpType FROM hipparcos_full WHERE (SpType LIKE 'M%Ia%' OR SpType LIKE 'M%Ib%')", function (err, row) {
      if (err) return
      points.push({
        target: {
          name: 'R' + points.length
        },
        ra: {
          decimal: row.RAdeg
        },
        dec: {
          decimal: 1
          // decimal: row.DEdeg
        },
        html: '<a href="https://simbad.u-strasbg.fr/simbad/sim-id?Ident=HIP+' + row.HIP + '" target="_blank">HIP ' + row.HIP + '</a> (Red Giant)',
        colour: 'rgb(255,50,50)'
      })
    }, function (err, count) {
      if (err) return cb(err)
      console.log('found', points.length, 'Red Giant stars')
      var str = JSON.stringify(points, null, 2)
      fs.writeFileSync(out, str)
      console.log('wrote', out)
      cb()
    })
  },
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
          decimal: -1,
          // decimal: row.DEdeg
        },
        html: '<a href="https://simbad.u-strasbg.fr/simbad/sim-id?Ident=HIP+' + row.HIP + '" target="_blank">HIP ' + row.HIP + '</a> (Wolf-Rayet)',
        colour: 'rgb(255,255,50)'
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

      var system = anoikis.systems[solarSystemName]
      var colour = 'rgb(100,100,100)'

      switch (system.effectName) {
        case 'Cataclysmic Variable':
          colour = 'rgb(169,0,255)'
          break;
        case 'Magnetar':
          colour = 'rgb(30,211,67)'
          break;
        case 'Black Hole':
          colour = 'rgb(0,0,255)'
          break;
        case 'Red Giant':
          colour = 'rgb(255,0,0)'
          break;
        case 'Pulsar':
          colour = 'rgb(0,255,0)'
          break;
        case 'Wolf-Rayet Star':
          colour = 'rgb(255,255,0)'
          break;
        default:
          colour = 'rgb(100,100,100)'
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
        html: '<a href="http://anoik.is/systems/' + solarSystemName + '" target="_blank">' + solarSystemName + '</a> (' + system.wormholeClass.toUpperCase() + ')' + (system.effectName ? '<br>' + system.effectName : ''),
        colour
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
  hip.close()
  console.log('done')
})
