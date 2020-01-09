'use strict';

let yourVlSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v2.0.json',
    description: 'A simple bar chart with embedded data.',
    data: {
      values: [
        {a: 'Autos', b: 12},
        {a: 'CS-Autos', b: 22},
        {a: '18-25 Jährige', b: 44},
        {a: 'Dichte', b: 3}
      ]
    },
    mark: 'bar',
    encoding: {
      x: {field: 'a', type: 'ordinal'},
      y: {field: 'b', type: 'quantitative'}
    }
};
vegaEmbed('#matrix', yourVlSpec);



let baseMaps = {};
let overlayMaps = {};
let map = L.map('map').setView([49.0159, 8.4095], 12);

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
        agePerDistrict: await (await fetch('data/alter.json')).json(),
        pointof: await (await fetch('data/pointsofinterestB.json')).json(),
        places: await (await fetch('data/places.json')).json(),
        pointof: await (await fetch('data/pointsofinterest2.json')).json()
    };


    let district = L.geoJSON(data.district, {
        onEachFeature: (feature, layer) => {
            let cityPopulation = data.population[feature.properties.name];
            let cityArea = data.area[feature.properties.name];
            let carPerDistrict = data.carPerDistrict[feature.properties.name];
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
                <br>PKW: ${carPerDistrict}
                <div id="vis"></div>
            `);

            layer.on('popupopen', () => {
                let yourVlSpec = {
                    $schema: 'https://vega.github.io/schema/vega-lite/v2.0.json',
                    description: 'A simple bar chart with embedded data.',
                    data: {
                      values: [
                        {a: 'Autos', b: carPerDistrict},
                        {a: 'CS-Autos', b: data.carSharing.features.length},
                        {a: '18-25 Jährige', b: agePerDistrict},
                        {a: 'Dichte', b: cityPopulation / cityArea}
                      ]
                    },
                    mark: 'bar',
                    encoding: {
                      x: {field: 'a', type: 'ordinal'},
                      y: {field: 'b', type: 'quantitative'}
                    }
                };
                vegaEmbed('#vis', yourVlSpec);

                
                /*var polygon = L.polygon([
                    [51.51, -0.08],
                    [51.503, -0.06],
                    [51.51, -0.047]
                ]).addTo(map);

                console.log( polygon.contains( [51.506, -0.06] ) )
                //overlayMaps["Car-Sharing-Stationen"] */

                if (layer instanceof L.Polygon) {
                    console.log("poly")
                }

                var polygon = L.polygon([
                    [51.51, -0.08],
                    [51.503, -0.06],
                    [51.51, -0.047]
                  ]).addTo(map);
                  var m1 = L.marker([49.01449,8.40009]);

                  // https://gis.stackexchange.com/questions/120522/loop-through-a-marker-cluster-using-leafletjs/234332
                  /* overlayMaps["Car-Sharing-Stationen"].eachLayer( (lay) => {
                    console.log( layer.contains( lay.getLatLng() ) );
                  } );

                  console.log(polygon.contains(m1.getLatLng()));
                  console.log('asd' + layer.contains(m1.getLatLng())); */

            })


// https://github.com/hayeswise/Leaflet.PointInPolygon            


// ?
// https://gis.stackexchange.com/questions/238940/selecting-markers-within-a-geojson-polygon-leaflet


// getPlayer return marker/polygon
// https://stackoverflow.com/questions/34322864/finding-a-specific-layer-in-a-leaflet-layergroup-where-layers-are-polygons


// if (layer instanceof L.Polygon) {
// https://stackoverflow.com/questions/35130492/how-can-i-detect-a-click-on-the-edge-of-a-polygon-with-leaflet

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



    
    let points = L.layerGroup();
    console.log(data.pointof)
    data.pointof.forEach((test) => {
        console.log(test)
        let marker = L.marker([test.geoPosition.latitude, test.geoPosition.longitude]);
        marker.bindPopup(`${test.places[0].bookeeIds.length}`, {
            autoClose: false
        }).openPopup();
        marker.addTo(points);
    });
    overlayMaps["test"] = points;


    let places = L.layerGroup();
    data.places.forEach((test) => {
        console.log(test)
        let marker = L.marker([test.geoPosition.latitude, test.geoPosition.longitude]);
        marker.bindPopup(`${test.name}<br>${test.bookeeIds.length}`, {
            autoClose: false
        }).openPopup();
        marker.addTo(places);
    });
    overlayMaps["test2"] = places;



    L.control.layers(baseMaps, overlayMaps).addTo(map);
})();

let getDensityColor = (d) => {
	return d > 50 ? '#023388' :
		   d > 40 ? '#1d4992' :
		   d > 30 ? '#42649a' :
		   d > 20 ? '#6a85b0' :
		   d > 10 ? '#96a7b9' :
				    '#cbcbcb';
}
