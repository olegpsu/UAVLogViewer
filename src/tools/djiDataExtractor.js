window.radians = function (a) {
    return 0.0174533 * a
}

export class DjiDataExtractor {
    static extractAttitude (messages, source) {
        const attitudes = {}
        // console.log('extractAttitude', messages, source)
        if (source in messages) {
            // console.log('extractAttitude', messages[source])
            const attitudeMsgs = messages[source]
            // console.log('attitudeMsgs', attitudeMsgs)
            for (const i in attitudeMsgs.time_boot_ms) {
                // console.log('attitudeMsgs.time_boot_ms[i]', attitudeMsgs.time_boot_ms[i])
                // console.log(attitudeMsgs)
                attitudes[parseInt(attitudeMsgs.time_boot_ms[i])] =
                    [
                        window.radians(attitudeMsgs.roll[i]),
                        window.radians(attitudeMsgs.pitch[i]),
                        window.radians(attitudeMsgs.yaw[i])
                    ]
            }
        }
        return attitudes
    }

    static extractAttitudeSources (messages) {
        const result = {
            quaternions: [],
            eulers: ['OSD']
        }
        return result
    }

    static extractEvents (messages) {
        return []
    }

    static extractFlightModes (messages) {
        return [[0, 'Normal']]
    }

    static extractMission (messages) {
        return []
    }

    static extractParams (messages) {
        return undefined
    }

    static extractFences (messages) {
        return []
    }

    static extractDefaultParams (messages) {
        return []
    }

    static extractVehicleType (messages) {
        return 'quadcopter'
    }

    static extractTextMessages (messages) {
        const texts = []
        if ('STATUSTEXT' in messages) {
            const textMsgs = messages.STATUSTEXT
            for (const i in textMsgs.time_boot_ms) {
                texts.push([textMsgs.time_boot_ms[i], textMsgs.severity[i], textMsgs.text[i]])
            }
        }
        if ('MSG' in messages) {
            const textMsgs = messages.MSG
            for (const i in textMsgs.time_boot_ms) {
                texts.push([textMsgs.time_boot_ms[i], 0, textMsgs.Message[i]])
            }
        }
        return texts
    }

    static extractTrajectorySources (messages) {
        return ['OSD']
    }

    static extractTrajectory (messages, source) {
        // returns a dict with the trajectories found
        console.log('extractTrajectory', messages, source)
        const ret = {}
        if ('OSD' in messages && source === 'OSD') {
            const trajectory = []
            const timeTrajectory = {}
            let startAltitude = null
            const gpsData = messages.OSD
            let start = 0
            for (const i in gpsData.time_boot_ms) {
                const delta = gpsData.time_boot_ms[i] - start
                if (delta < 200) {
                    continue
                }
                start = gpsData.time_boot_ms[i]
                // console.log('extractTrajectory', gpsData)
                if (gpsData.latitude[i] !== 0) {
                    if (startAltitude === null) {
                        startAltitude = gpsData.altitude[i]
                    }
                    trajectory.push(
                        [
                            gpsData.longitude[i],
                            gpsData.latitude[i],
                            gpsData.altitude[i] - startAltitude,
                            gpsData.time_boot_ms[i]
                        ]
                    )
                    timeTrajectory[gpsData.time_boot_ms[i]] = [
                        gpsData.longitude[i],
                        gpsData.latitude[i],
                        (gpsData.altitude[i] - startAltitude) / 1000,
                        gpsData.time_boot_ms[i]]
                }
            }
            if (trajectory.length) {
                ret.OSD = {
                    startAltitude: startAltitude,
                    trajectory: trajectory,
                    timeTrajectory: timeTrajectory
                }
            }
        }

        console.log('extractTrajectory', ret)
        return ret
    }

    static extractWindData (messages, source) {
        console.log('extractWindData', messages, source)
        const ret = {}
        if ('XKF2[0]' in messages && source === 'XKF2[0]') {
            const windData = messages['XKF2[0]']
            const windVectors = []
            const windTimeSeries = {}

            for (let i = 0; i < windData.time_boot_ms.length; i++) {
                const time = windData.time_boot_ms[i]
                const vwe = windData.VWE[i]
                const vwn = windData.VWN[i]

                // Wind vector calculate
                let windVector = (Math.atan2(-vwe, -vwn) * (180 / Math.PI) + 360) % 360
                if (windVector < 0) windVector += 360

                const windSpeed = Math.sqrt(vwe * vwe + vwn * vwn)
                if (vwe === 0 && vwn === 0 && windSpeed === 0) {
                    windVector = 0
                }

                windVectors.push([vwe, vwn, windVector, time, windSpeed])
                windTimeSeries[time] = { vwe, vwn, windVector, time, windSpeed }
            }

            if (windVectors.length > 0) {
                ret.windVectors = windVectors
                ret.windTimeSeries = windTimeSeries
            }
        }
        return ret
    }

    static extractNamedValueFloatNames (_messages) {
        // this mechanism is not used for dataflash logs
        return []
    }

    static extractStartTime (messages) {
        return 0
    }
}
