module.exports = function toTranslationKeys (cal) {
  const roomsByKey = {}
  const nrByPerson = {}
  Object.keys(cal.rooms).forEach(room => {
    cal.rooms[room].forEach(entry => {
      let key
      if (entry.hasCustomId) {
        key = `ID[${entry.id}]`
      } else if (entry.person) {
        const nr = (nrByPerson[entry.person] || 0) + 1
        nrByPerson[entry.person] = nr
        key = `#${nr} by ${entry.person}`
      } else {
        key = entry.summary
      }
      let entriesByRoom = roomsByKey[key]
      if (!entriesByRoom) {
        entriesByRoom = {}
        roomsByKey[key] = entriesByRoom
      }
      let entries = entriesByRoom[room]
      if (!entries) {
        entries = []
        entriesByRoom[room] = entries
      }
      entries.push(entry)
    })
  })
  const keys = {}
  Object.keys(roomsByKey).forEach(key => {
    const entriesByRoom = roomsByKey[key]
    const rooms = Object.keys(entriesByRoom)
    rooms.forEach(room => {
      let roomPrefix = ''
      if (rooms.length > 1) {
        roomPrefix = room
      }
      const entries = entriesByRoom[room]
      entries.forEach((entry, entryIndex) => {
        let prefix = roomPrefix
        if (entries.length > 1) {
          prefix = `${roomPrefix}#${entryIndex + 1}`
        }
        if (prefix !== '') {
          prefix += ': '
        }
        keys[`${prefix}${key}`] = entry
      })
    })
  })
  return keys
}
