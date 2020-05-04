'use strict';

const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const mongoose = require('mongoose');
const papaparse = require('papaparse');
const { unit: Unit, building: Building, complex: Complex } = require('@kasadev/db-schemas')(mongoose);
const { run, getSecret, connectToDb, disconnectFromDb } = require('../../helpers');

run(
  async () => {
    const { stage, localDbUrl, complexInternalTitle } = await inquirer.prompt([
      {
        name: 'complexInternalTitle',
        message: 'Internal title of the complex where the unit backup codes should be replaced?',
        type: 'input',
      },
      {
        name: 'stage',
        message: 'Select stage (used to decide which db to connect to)',
        type: 'list',
        choices: ['production', 'dev', 'local'],
      },
      {
        name: 'localDbUrl',
        message: 'What is the url of the local database?',
        when: answers => answers.stage === 'local',
      },
    ]);

    const [mongoError, mongoUrl] =
      stage === 'local' ? [null, localDbUrl] : await getSecret(`${stage}/credentials/mongoUrl`);

    if (mongoError) {
      throw mongoError;
    }

    await connectToDb(mongoUrl);

    const complex = await Complex.find({ internalTitle: complexInternalTitle })
      .select('')
      .exec();

    if (!complex) {
      console.error(`No complex was found with internalTitle: "${complexInternalTitle}"`);
      return;
    }

    console.log(`Found complex with internalTitle: "${complexInternalTitle}"`);

    const cursor = await Complex.find({ complex }).cursor();

    const csvData = [];

    for (let complex = await cursor.next(); complex != null; complex = await cursor.next()) {
      const newPropertyHeroImage = askImageInfo();
      const csvRow = [complex.internalTitle, newHeroImage];
      if (Object.isObject(complex.propertyHeroImage)) {
        askImageInfo();
        complex.propertyHeroImage.push(newHeroImage);
      } else {
        csvRow.push('');
        complex.propertyHeroImage = {newHeroImage};
      }

      await complex.save();
      csvData.push(csvRow);
      console.log(`Finished updating complex "${complex.internalTitle}"`);
    }

    console.log('Finished updating complex. Writing csv...');

    const csv = papaparse.unparse({
      fields: ['url', 'bytes', 'width', 'height', 'publicId', 'version'],
      data: csvData,
    });

    const filePath = path.join(__dirname, `${complexInternalTitle}-newHeroImage.csv`);

    fs.writeFileSync(filePath, csv);
    console.log(`Finished writing csv to ${filePath}`);
  },

  function askImageInfo() {
    const { url, bytes, width, height, publicId, version } = await inquirer.prompt([
      {
        name: 'url',
        message: 'url of the Hero Image?',
        type: 'input',
      },
      {
        name: 'bytes',
        message: 'byte size?',
        type: 'input',
      },
      {
        name: 'width',
        message: 'width?',
        type: 'input',
      },
      {
        name: 'height',
        message: 'height?',
        type: 'input',
      },
      {
        name: 'publicId',
        message: 'publicId?',
        type: 'input',
      },
      {
        name: 'version',
        message: 'version?',
        type: 'input',
      },
    ]);
  collection.update({complex});
  },
  {
    onFinish: disconnectFromDb,
  }
);
