'use strict';

let baseMaps = {};
let overlayMaps = {};
let map = L.map('map').setView([49.0159, 8.4095], 12);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
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
        busStops: await (await fetch('data/bus_haltestellen_karlsruhe.geojson')).json()
    };


    let district = L.geoJSON(data.district, {
        onEachFeature: (feature, layer) => {
            let cityPopulation = data.population[feature.properties.name];
            let cityArea = data.area[feature.properties.name];
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
                <br>Fläche: ${cityArea}
                <br>Bevölkerungdichte: ${Math.floor(cityPopulation / cityArea)}
            `);
        }
    }).addTo(map);
    baseMaps["Bevölkerungsdichte"] = district;


    let residential = L.geoJSON(data.residential, {
        onEachFeature: (feature, layer) => layer.setStyle({ fillColor: 'purple', color: 'purple' })
    });
    baseMaps["Wohnraum"] = residential;
    baseMaps["Aus"] = L.layerGroup([]);


    let tramStops = L.geoJSON(data.tramStops, {
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, { color: 'red', radius: 6 })
    });
    overlayMaps["Straßenbahnhaltestellen"] = tramStops;


    let busStops = L.geoJSON(data.busStops, {
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, { color: 'green', radius: 6 })
    });
    overlayMaps["Bushaltestellen"] = busStops;


    let carSharingTemp = [];
    let carSharing = L.geoJSON(data.carSharing, {
        // use marker for polygons
        onEachFeature: (feature, layer) => {
            if (feature.geometry.type === 'Polygon') {
                let bounds = layer.getBounds();
                let center = bounds.getCenter();
                let marker = L.circleMarker(center, { radius: 6 });
                carSharingTemp.push(marker);
            }
        },

        pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 6 })
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
