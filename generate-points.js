var sqlite3 = require('sqlite3')

//var hip = new sqlite3.Database('hip.sqlite')
//var wds = new sqlite3.Database('wds.sqlite')
//var systems = new sqlite3.Database('eve-systems.sqlite')

var anoikis = require('./anoikis.json')
var fs = require('fs')
var out = './j-numbers.json'

function pad (n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

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
      name: 'M' + points.length
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
