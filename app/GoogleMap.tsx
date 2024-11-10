// app/GoogleMapScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import GoogleMapReact from 'google-map-react';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';

const GOOGLE_API_KEY = 'AIzaSyAUwcgoinASwKDHlKDuW9HvNodSkBz64YI'; 

const GoogleMapScreen: React.FC = () => {
  const { placeName } = useLocalSearchParams<{ placeName: string }>();

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [cityLocation, setCityLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCityCoordinates = async () => {
      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            address: placeName,
            key: GOOGLE_API_KEY,
          },
        });

        if (response.data.status !== 'OK') {
          console.error('Geocoding API error:', response.data.error_message || response.data.status);
          alert(`Geocoding API error: ${response.data.error_message || response.data.status}`);
          setLoading(false);
          return;
        }

        const location = response.data.results[0].geometry.location;
        setCityLocation({
          latitude: location.lat,
          longitude: location.lng,
        });
      } catch (error) {
        console.error('Error fetching city location:', error);
        alert('Failed to fetch city location.');
        setLoading(false);
      }
    };

    const fetchUserLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLoading(false);
          },
          (error) => {
            console.error('Error getting user location:', error);
            alert('Failed to get current location.');
            setLoading(false);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        alert('Geolocation not supported.');
        setLoading(false);
      }
    };

    fetchCityCoordinates();
    fetchUserLocation();
  }, [placeName]);

const handleApiLoaded = (map: any, maps: any) => {
  const origin = { lat: userLocation!.latitude, lng: userLocation!.longitude };
  const destination = { lat: cityLocation!.latitude, lng: cityLocation!.longitude };
  const directionsService = new maps.DirectionsService();
  const directionsRenderer = new maps.DirectionsRenderer();
  directionsRenderer.setMap(map);
  const originMarker = new maps.Marker({
    position: origin,
    map,
    title: 'Your Location',
  });

  const destinationMarker = new maps.Marker({
    position: destination,
    map,
    title: placeName || 'Destination',
  });

  directionsService.route(
    {
      origin: origin,
      destination: destination,
      travelMode: maps.TravelMode.DRIVING,
    },
    (result: any, status: any) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
      } else {
        console.error('Directions request failed due to ' + status);
        alert('Directions request failed due to ' + status);
      }
    }
  );
};

  if (loading || !userLocation || !cityLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  const center = {
    lat: (userLocation.latitude + cityLocation.latitude) / 2,
    lng: (userLocation.longitude + cityLocation.longitude) / 2,
  };

  const zoom = 8;

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{
          key: GOOGLE_API_KEY,
          libraries: ['places', 'geometry'],
        }}
        defaultCenter={center}
        defaultZoom={zoom}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
      />
    </div>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GoogleMapScreen;

