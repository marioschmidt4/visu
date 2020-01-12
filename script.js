'use strict';

let baseMaps = {};
let overlayMaps = {};
let map = L.map('map', {zoomSnap: 0.1}).setView([49.0159, 8.4095], 12);

L.tileLayer('http://a.tile.stamen.com/toner/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

(async () => {
    let data = {
        getaround: await (await fetch('data/2019-12-08 14-00-05.json')).json(),
        residential: await (await fetch('data/landuse_residential_karlsruhe.geojson')).json(),
        carSharing: await (await fetch('data/car_sharing_karlsruhe.geojson')).json(),
        population: await (await fetch('data/wohnberechtigte_bevoelkerung_karlsruhe.json')).json(),
        area: await (await fetch('data/flaeche_karlsruhe.json')).json(),
        district: await (await fetch('data/stadtteil_karlsruhe.geojson')).json(),
        tramStops: await (await fetch('data/straba_haltestellen_karlsruhe.geojson')).json(),
        busStops: await (await fetch('data/bus_haltestellen_karlsruhe.geojson')).json(),

        carPerDistrict: await (await fetch('data/pkw_karlsruhe.json')).json(),
        csCarPerDistrict: await (await fetch('data/pkw_cs_karlsruhe.json')).json(),
        agePerDistrict: await (await fetch('data/alter.json')).json(),
        pointof: await (await fetch('data/pointsofinterestB.json')).json(),
        places: await (await fetch('data/places.json')).json(),
        pointof: await (await fetch('data/pointsofinterest2.json')).json()
    };

    let yourVlSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.0.2.json',
        description: 'A simple bar chart with embedded data.',
        width: "container",
        data: {
            values: objectsToArray(data.carPerDistrict, data.csCarPerDistrict)
        },
        hconcat: [
            {
                width: "container",
                layer: [
                    {
                        selection: {
                            highlight: {"type": "single", "empty": "none", "on": "mouseover"},
                            select: {"type": "multi"}
                        },
                        mark: 'bar',
                        encoding: {
                            x: {
                                field: 'district',
                                type: 'ordinal',
                                sort: {
                                    "encoding": "y",
                                    "order": "descending"
                                },
                                axis: {
                                    labelLimit: 100,
                                    labelOverlap: false,
                                    labelAngle: -45,
                                    labelFontSize: 14
                                },
                                title: "Stadtteil"
                            },
                            y: {
                                field: 'amount1', type: 'quantitative', title: "Anzahl Autos", axis: {labelAngle: -45}
                            },
                            fillOpacity: {
                                condition: {"selection": "select", "value": 1},
                                value: 0.3
                            },
                        }
                    },
                    {
                        mark: "rule",
                        encoding: {
                            y: {
                                aggregate: "mean",
                                field: "amount1",
                                type: "quantitative"
                            },
                            color: {"value": "firebrick"},
                            size: {"value": 3}
                        }
                    }
                ]
            },
            {
                layer: [
                    {
                        width: "container",
                        mark: 'bar',
                        encoding: {
                            x: {
                                field: 'district',
                                type: 'ordinal',
                                sort: {
                                    "encoding": "y",
                                    "order": "descending"
                                },
                                axis: {
                                    labelLimit: 100,
                                    labelOverlap: false,
                                    labelAngle: -45,
                                    labelFontSize: 14
                                },
                                title: "Stadtteil"
                            },
                            y: {
                                field: 'amount2',
                                type: 'quantitative',
                                title: "Anzahl Car-Sharing-Autos",
                                axis: {labelAngle: -45}
                            },
                            fillOpacity: {
                                condition: {"selection": "select", "value": 1},
                                value: 0.3
                            },
                        },
                    },
                    {
                        mark: "rule",
                        encoding: {
                            y: {
                                aggregate: "mean",
                                field: "amount2",
                                type: "quantitative"
                            },
                            color: {"value": "firebrick"},
                            size: {"value": 3}
                        }
                    }
                ]
            }
        ]
    };
    let v = await vegaEmbed('#matrix', yourVlSpec);

    v.view.addEventListener("click", (event, item) => {
        console.log(item.datum)
        
        district.eachLayer((layer) => {
            layer.setStyle({color: 'black'})

            if (item.datum.district === undefined) {
                map.fitBounds(district.getBounds(), {padding: [25, 25]});
            } else if (layer.feature.properties.name === item.datum.district) {
                layer.bringToFront()
                layer.setStyle({color: 'red'})
                map.fitBounds(layer.getBounds(), {padding: [50, 50]});
            }
        });
    })

    
    let district = L.geoJSON(data.district, {
        onEachFeature: (feature, layer) => {
            let cityPopulation = data.population[feature.properties.name];
            let cityArea = data.area[feature.properties.name];
            let carPerDistrict = data.carPerDistrict[feature.properties.name];
            let csCarPerDistrict = data.csCarPerDistrict[feature.properties.name];
            let agePerDistrict = data.agePerDistrict[feature.properties.name];
            let color = getDensityColor(cityPopulation / cityArea);
            layer.setStyle({
                'color': 'black',
                'fillColor': color,
                'fillOpacity': 0.9
            });

            layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.5 }));
            layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.9 }));

            layer.bindPopup(`
                <span style="font-size: 20px">${feature.properties.name}</span>
                <br>Bevölkerung: ${cityPopulation}
                <br>Fläche: ${cityArea} ha
                <br>Bevölkerungdichte: ${Math.floor(cityPopulation / cityArea)} je ha
                <br>Autos: ${carPerDistrict}
                <br>Car-Sharing-Autos: ${csCarPerDistrict}
                <div id="vis"></div>
            `);

            layer.on('popupopen', () => {
                let popUpSpec = {
                    $schema: 'https://vega.github.io/schema/vega-lite/v4.0.2.json',
                    description: 'A simple bar chart with embedded data.',
                    data: {
                      values: [
                        {a: 'Autos', b: carPerDistrict},
                        {a: 'CS-Autos', b: csCarPerDistrict}
                      ]
                    },
                    mark: 'bar',
                    encoding: {
                      x: {field: 'a', type: 'ordinal'},
                      y: {field: 'b', type: 'quantitative', "scale": {"domain": [0, 15000]}}
                    }
                };
                vegaEmbed('#vis', popUpSpec);
            })
        }
    }).addTo(map);
    baseMaps["Bevölkerungsdichte"] = district;


    let residential = L.geoJSON(data.residential, {
        onEachFeature: (feature, layer) => layer.setStyle({ fillColor: 'purple', color: 'purple' })
    });
    baseMaps["Wohnraum"] = residential;
    baseMaps["Aus"] = L.layerGroup([]);


    let tramStops = L.geoJSON(data.tramStops, {
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, { color: 'red', radius: 2 })
    });
    overlayMaps["Straßenbahnhaltestellen"] = tramStops;


    let busStops = L.geoJSON(data.busStops, {
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, { color: 'green', radius: 2 })
    });
    overlayMaps["Bushaltestellen"] = busStops;


    let carSharingTemp = [];
    let carSharing = L.geoJSON(data.carSharing, {
        // use marker for polygons
        onEachFeature: (feature, layer) => {
            if (feature.geometry.type === 'Polygon') {
                let bounds = layer.getBounds();
                let center = bounds.getCenter();
                let marker = L.circleMarker(center, { radius: 2 });
                carSharingTemp.push(marker);
            }
        },

        pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 2 })
    });
    carSharingTemp.forEach(e => e.addTo(carSharing));
    overlayMaps["Car-Sharing-Stationen"] = carSharing;


    let cars = L.layerGroup();
    data.getaround.cars.forEach((car) => {
        let marker = L.marker([car.shiftedLatitude, car.shiftedLongitude]);
        marker.bindPopup(`${car.carTitle}<br><img width="120" src="${car.carThumbUrl}" />`, {
            autoClose: false
        }).openPopup();
        marker.addTo(cars);
    });
    overlayMaps["Autos von Getaround"] = cars;

    
    let options = {collapsed: navigator.userAgent.includes("Mobile")}
    L.control.layers(baseMaps, overlayMaps, options).addTo(map);
})();

let getDensityColor = (d) => {
	return d > 50 ? '#023388' :
		   d > 40 ? '#1d4992' :
		   d > 30 ? '#42649a' :
		   d > 20 ? '#6a85b0' :
		   d > 10 ? '#96a7b9' :
				    '#cbcbcb';
}

let objectsToArray = (obj1, obj2) => {
    let temp = [];
    for (let [key, value] of Object.entries(obj1)) {
        temp.push({district: key, amount1: value, amount2: obj2[key]});
    }
    return temp.sort( (a,b) => a.amount > b.amount );
}
