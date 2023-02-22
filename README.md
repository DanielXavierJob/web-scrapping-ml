
# Web Scrapping ML 📝  
Help make this project better, make a PR

# IMPORTANT
This project is not intended to do wrong things with the Mercado Livre website, much less steal confidential information, it just enters each product page and searches for **Product name**, **Product value**, 
**Cost of freight**.
If you have the wrong thoughts to use this project, it is at your own risk, and the developer will not be responsible for the bad nature of those who will be using it, this project being only for studies

## Configurations
- node v19.7.0
- puppeteer v19.7.2
- puppeteer-cluster v0.23.0
- puppeteer-extra v3.3.4
- puppeteer-extra-plugin-adblocker v2.13.5
- puppeteer-extra-plugin-stealth v2.11.1

## Installation
Execute ``` npm install```

## How to use
- get first page of *Acer Nitro 5* and the informations 
    - `npm run start -- --search="Acer Nitro 5" --cep=123456789` 


All command has prefix `npm run start --`

| Command | Description | Type | Required | Example |
| :---: | :---: | :---: | :---: | :---: | 
| `--search=` |  Field product name | string | required | `--search="Acer nitro 5"`
| `--showBrowser=` | Show the IDLE Browser running | boolean | optional | `--showBrowser=true`
| `--cep=` | Set the CEP local to get price of taxes | number | required | `--cep=12345678` |
| `--allPages=`| Get all products of paginations | boolean | optional | `--allPages=true` |
| `--wait=` | Set wait in **ms** for search product per product | number | optional | `--wait=5000` |
| `--help` | Given the list of commands |-|-| `--help`|