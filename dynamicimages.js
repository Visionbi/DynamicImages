"use strict";

// Wrap everything in an anonymous function to avoid poluting the global namespace
(() => {
  const defaultIntervalInMin = "5";
  let unregisterHandlerFunctions = [];
  let oldSortParam;
  let newSortParam;

  // Use the jQuery document ready signal to know when everything has been initialized
  $(document).ready(() => {
    // Tell Tableau we'd like to initialize our extension
    tableau.extensions
      .initializeAsync({ configure: configure })
      .then(function() {
        // This event allows for the parent extension and popup extension to keep their
        // settings in sync.  This event will be triggered any time a setting is
        // changed for this extension, in the parent or popup (i.e. when settings.saveAsync is called).
        let currentSettings = tableau.extensions.settings.getAll();
        fetchFilter();
        fetchParameter();
        fetchCurrentSettings();
        if (typeof currentSettings.sheet !== "undefined") {
          $("#inactive").hide();

          //updateExtensionBasedOnSettings(currentSettings.newSettings);
          parseInfo(currentSettings);
        }

        //console.log(savedSettingsInfo);
        //console.log(settingsEvent);
      });
  });

  /**
   * Shows the choose sheet UI. Once a sheet is selected, the data table for the sheet is shown
   */

  let unregisterEventHandlerFunction;

  function configure() {
    const popupUrl = `${
      window.location.origin
    }/DynamicImages/extensionDialog.html`;

    tableau.extensions.ui
      .displayDialogAsync(popupUrl, defaultIntervalInMin, {
        height: 500,
        width: 500
      })
      .then(closePayload => {
        $("#inactive").hide();
        $("#active").show();

        // The close payload is returned from the popup extension via the closeDialog method.
      })
      .catch(error => {
        //  ...
        // ... code for error handling
      });
  }

  function displayImages(images, count, countText, percentages, prices) {
    let slideSize = 102;
    $("#selected_marks").empty();

    const navigation = $("<div>", {
      class: "navigation"
    }).appendTo("#selected_marks");

    $("<div>", {
      class: "leftArrow"
    })
      .click(() => {
        $(".images").animate({ scrollLeft: "-=" + slideSize }, 500);
      })
      .appendTo(navigation);

    const imagesContainer = $("<div>", {
      class: "images"
    }).appendTo(navigation);

    for (let i = 0; i < images.length; i++) {
      let imageContainer = $("<div>", {
        class: "imageContainer"
      }).appendTo("#selected_marks");

      let image = images[i][0] + " ".split(",");
      let singleCount = count[i][0] + " ".split(",");
      let singleCountText = countText[i][0] + " ".split(",");
      let singlePercentages = percentages[i][0] + " ".split(",");
      let singlePrice = prices[i][0] + " ".split(",");

      $("<img />", {
        src: `${image}`,
        alt: ""
      }).appendTo(imageContainer);

      let firstLine = "";

      if (singleCount.indexOf("undefined") === -1) {
        firstLine += singleCount;
      }

      if (singlePrice.indexOf("undefined") === -1) {
        firstLine += singlePrice;
      }

      if (singleCountText.indexOf("undefined") === -1) {
        firstLine += singleCountText;
      }

      $("<div>", {
        class: "counter"
      })
        .text(`${firstLine}`)
        .appendTo(imageContainer);

      if (singlePercentages.indexOf("undefined") === -1) {
        $("<div>", {
          class: "percentages"
        })
          .text(`${singlePercentages}`)
          .appendTo(imageContainer);
      }

      imagesContainer.append(imageContainer);
    }

    $("<div>", {
      class: "rightArrow"
    })
      .click(() => {
        $(".images").animate({ scrollLeft: "+=" + slideSize }, 500);
      })
      .appendTo(navigation);
  }

  function updateExtensionBasedOnSettings(settings) {
    if (settings) {
      savedInfo = settings;
    }
  }

  // This letiable will save off the function we can call to unregister listening to marks-selected events
  function initializeButtons() {
    $("#show_choose_sheet_button").click(showChooseSheetDialog);
  }

  function getSelectedSheet(worksheetName) {
    // go through all the worksheets in the dashboard and find the one we want
    return tableau.extensions.dashboardContent.dashboard.worksheets.find(
      function(sheet) {
        return sheet.name === worksheetName;
      }
    );
  }

  function parseInfo(settings) {
    if (unregisterEventHandlerFunction) {
      unregisterEventHandlerFunction();
    }

    let worksheetsName = settings.sheet;
    const worksheet = getSelectedSheet(worksheetsName);
    unregisterEventHandlerFunction = worksheet.addEventListener(
      tableau.TableauEventType.FilterChanged,
      function(selectionEvent) {
        parseInfo(settings);
      }
    );

    let indexImage = settings.selectedImage[1];
    let indexCount = settings.selectedCount[1];
    let indexCountText = settings.selectedCountText[1];
    let indexPercentages = settings.selectedPercentages[1];
    let indexPrices = settings.selectedPrices[1];

    worksheet.getSummaryDataAsync().then(marks => {
      const worksheetData = marks;

      const image = worksheetData.data.map(row => {
        const rowData = row.map(cell => {
          return cell.formattedValue;
        });
        return [rowData[indexImage]];
      });

      const count = worksheetData.data.map(row => {
        const rowData = row.map(cell => {
          return cell.formattedValue;
        });
        return [rowData[indexCount]];
      });

      const countText = worksheetData.data.map(row => {
        const rowData = row.map(cell => {
          return cell.formattedValue;
        });
        return [rowData[indexCountText]];
      });

      const percentages = worksheetData.data.map(row => {
        const rowData = row.map(cell => {
          return cell.formattedValue;
        });

        // format percentages as float
        if (isFloat(rowData[indexPercentages])) {
          rowData[indexPercentages] =
            (rowData[indexPercentages] * 100).toFixed(2) + "%";
        }

        return [rowData[indexPercentages]];
      });

      const prices = worksheetData.data.map(row => {
        const rowData = row.map(cell => {
          return cell.formattedValue;
        });

        // format price as float
        if (isFloat(rowData[indexPrices])) {
          rowData[indexPrices] = parseFloat(rowData[indexPrices]).toFixed(2);
        }

        return [rowData[indexPrices]];
      });

      // Populate the data table with the rows and columns we just pulled out
      displayImages(image, count, countText, percentages, prices);
    });
  }

  function getValueByParameter(paramName, currentSettings) {
    tableau.extensions.dashboardContent.dashboard
      .getParametersAsync()
      .then(params => {
        const parameter = params.find(param => {
          return param.name === paramName;
        });

        if (oldSortParam != newSortParam) {
          oldSortParam = parameter.parameterImpl.currentValue.formattedValue;
          newSortParam = parameter.parameterImpl.currentValue.formattedValue;
          parseInfo(currentSettings);
        } else {
          oldSortParam = parameter.parameterImpl.currentValue.formattedValue;
          // sortParamChanged = false;
        }
      });
  }

  const isFloat = value => {
    return !isNaN(value) && value.toString().indexOf(".") != -1;
  };

  function fetchCurrentSettings() {
    // While performing async task, show loading message to user.
    //$('#loading').addClass('show');

    // Whenever we restore the filters table, remove all save handling functions,
    // since we add them back later in this function.
    unregisterHandlerFunctions.forEach(unregisterHandlerFunction => {
      unregisterHandlerFunction();
    });

    // Since filter info is attached to the worksheet, we will perform
    // one async call per worksheet to get every filter used in this
    // dashboard.  This demonstrates the use of Promise.all to combine
    // promises together and wait for each of them to resolve.
    let filterFetchPromises = [];

    // List of all filters in a dashboard.
    let dashboardfilters = [];

    // To get filter info, first get the dashboard.
    const dashboard = tableau.extensions.dashboardContent.dashboard;

    tableau.extensions.settings.addEventListener(
      tableau.TableauEventType.SettingsChanged,
      settingsEvent => {
        //console.log(settingsEvent);
        //updateExtensionBasedOnSettings(settingsEvent.newSettings);
        parseInfo(settingsEvent.newSettings);
      }
    );
  }

  function fetchFilter() {
    // While performing async task, show loading message to user.
    //$('#loading').addClass('show');

    // Whenever we restore the filters table, remove all save handling functions,
    // since we add them back later in this function.
    unregisterHandlerFunctions.forEach(unregisterHandlerFunction => {
      unregisterHandlerFunction();
    });

    // Since filter info is attached to the worksheet, we will perform
    // one async call per worksheet to get every filter used in this
    // dashboard.  This demonstrates the use of Promise.all to combine
    // promises together and wait for each of them to resolve.
    let filterFetchPromises = [];

    // List of all filters in a dashboard.
    let dashboardfilters = [];

    // To get filter info, first get the dashboard.
    const dashboard = tableau.extensions.dashboardContent.dashboard;

    // Then loop through each worksheet and get its filters, save promise for later.
    dashboard.worksheets.forEach(worksheet => {
      //filterFetchPromises.push(worksheet.getFiltersAsync());

      // Add filter event to each worksheet.  AddEventListener returns a function that will
      // remove the event listener when called.
      let unregisterHandlerFunction = worksheet.addEventListener(
        tableau.TableauEventType.FilterChanged,
        filterChangedHandler
      );
      //unregisterHandlerFunctions.push(unregisterHandlerFunction);
    });
  }

  function filterChangedHandler(filterEvent) {
    // Just reconstruct the filters table whenever a filter changes.
    // This could be optimized to add/remove only the different filters.
    //fetchFilters();
    //reload gauge
    const settingsSaved = tableau.extensions.settings.getAll();
    parseInfo(settingsSaved);
  }

  function fetchParameter() {
    // To get filter info, first get the dashboard.
    const dashboard = tableau.extensions.dashboardContent.dashboard;

    // Add event listener to dashbaord parameters
    dashboard.getParametersAsync().then(function(parameters) {
      parameters.forEach(function(parameter) {
        var unregisterHandlerFunction = parameter.addEventListener(
          tableau.TableauEventType.ParameterChanged,
          parameterChangedHandler
        );

        unregisterHandlerFunctions.push(unregisterHandlerFunction);
      });
    });
  }

  function parameterChangedHandler(filterEvent) {
    // Just reconstruct the parameters table whenever a filter changes.
    const settingsSaved = tableau.extensions.settings.getAll();
    parseInfo(settingsSaved);
  }
})();
