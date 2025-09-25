#!/usr/bin/env node

/**
 * Setup script for environment variables
 * This script helps set up the .env file with the correct Google Maps API key
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

console.log('🔧 Setting up environment variables...\n');

// Check if .env file exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  
  // Check if Google Maps API key is configured
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('REACT_APP_GOOGLE_MAPS_API_KEY=') && 
      !envContent.includes('REACT_APP_GOOGLE_MAPS_API_KEY=undefined')) {
    console.log('✅ Google Maps API key is configured');
  } else {
    console.log('⚠️  Google Maps API key needs to be configured');
    console.log('   Please update REACT_APP_GOOGLE_MAPS_API_KEY in your .env file');
  }
} else {
  console.log('📝 Creating .env file from env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
    console.log('⚠️  Please update REACT_APP_GOOGLE_MAPS_API_KEY in your .env file');
  } else {
    console.log('❌ env.example file not found');
  }
}

console.log('\n📋 Next steps:');
console.log('1. Get your Google Maps API key from: https://console.cloud.google.com/apis/credentials');
console.log('2. Enable these APIs in Google Cloud Console:');
console.log('   - Geocoding API');
console.log('   - Maps JavaScript API');
console.log('   - Places API (New)');
console.log('3. Update REACT_APP_GOOGLE_MAPS_API_KEY in your .env file');
console.log('4. Restart your development server');

console.log('\n🔗 Useful links:');
console.log('- Google Cloud Console: https://console.cloud.google.com/');
console.log('- Places API Migration: https://developers.google.com/maps/documentation/javascript/places-migration-overview');
console.log('- API Key Setup: https://developers.google.com/maps/documentation/javascript/get-api-key');
