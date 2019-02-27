(() => {
  /**
   * This extension collects the IDs of each datasource the user is interested in
   * and stores this information in settings when the popup is closed.
   */
  const imageSettingsKey = "selectedImage";
  const countSettingsKey = "selectedCount";
  const countTextSettingsKey = "selectedCountText";
  const percentagesSettingsKey = "selectedPercentages";

  let selectedImage = [];
  let selectedCount = [];
  let selectedCountText = [];
  let selectedPercentages = [];

  $(document).ready(() => {
    // The only difference between an extension in a dashboard and an extension
    // running in a popup is that the popup extension must use the method
    // initializeDialogAsync instead of initializeAsync for initialization.
    // This has no affect on the development of the extension but is used internally.
    tableau.extensions.initializeDialogAsync().then(openPayload => {
      // The openPayload sent from the parent extension in this sample is the
      // default time interval for the refreshes.  This could alternatively be stored
      // in settings, but is used in this sample to demonstrate open and close payloads.
      $("#interval").val(openPayload);
      $("#closeButton").click(closeDialog);

      let dashboard = tableau.extensions.dashboardContent.dashboard;

      // Loop through datasources in this sheet and create a checkbox UI
      // element for each one.  The existing settings are used to
      // determine whether a datasource is checked by default or not.
      dashboard.worksheets.forEach(worksheet => {
        const button = createButton(worksheet.name);
        button.click(() => {
          $("#images").empty();
          $("#count").empty();
          $("#percentages").empty();

          // Get the worksheet name which was selected
          let worksheetName = worksheet.name;
          tableau.extensions.settings.set("sheet", worksheetName);

          // Close the dialog and show the data table for this worksheet
          showChooseSelection(worksheetName);
        });

        $("#buttons").append(button);
      });
    });
  });

  /**
   * Helper that parses the settings from the settings namesapce and
   * returns a list of IDs of the datasources that were previously
   * selected by the user.
   */

  function showChooseSelection(worksheetName) {
    const worksheet = getSelectedSheet(worksheetName);

    const textFormat = $(
      "<h5>Select the field that indicated the URL of the image to display</h5>"
    );
    const textFormat2 = $("<h5>Select the count to display</h5>");
    const textFormat3 = $("<h5>Select the percentages to display</h5>");
    const textFormat4 = $("<h5>Select the count text to display</h5>");

    $("#images").append(textFormat);
    $("#count").append(textFormat2);
    $("#countText").append(textFormat4);
    $("#percentages").append(textFormat3);

    worksheet.getSummaryDataAsync().then(data => {
      const columnsTable = data.columns;
      columnsTable.forEach(name => {
        //addFieldItemToUI(name.fieldName);

        const imageFieldOptions = createImageFieldOptions(name);
        const countFieldOptions = createCountFieldOptions(name);
        const countTextFieldOptions = createCountTextFieldOptions(name);
        const percentagesFieldOptions = createPercentagesFieldOptions(name);
      });
    });
  }

  /**
   * Helper that updates the internal storage of datasource IDs
   * any time a datasource checkbox item is toggled.
   */
  function updateURL(id) {
    let idIndex = selectedImage.indexOf(id);

    if (idIndex < 0) {
      selectedImage.push(id);
    } else {
      selectedImage.splice(idIndex, 1);
    }
  }

  function updateCount(id) {
    let idIndex = selectedCount.indexOf(id);

    if (idIndex < 0) {
      selectedCount.push(id);
    } else {
      selectedCount.splice(idIndex, 1);
    }
  }

  function updateCountText(id) {
    let idIndex = selectedCountText.indexOf(id);

    if (idIndex < 0) {
      selectedCountText.push(id);
    } else {
      selectedCountText.splice(idIndex, 1);
    }
  }

  function updatePercentages(id) {
    let idIndex = selectedPercentages.indexOf(id);
    if (idIndex < 0) {
      selectedPercentages.push(id);
    } else {
      selectedPercentages.splice(idIndex, 1);
    }
  }

  function closeDialog() {
    let currentSettings = tableau.extensions.settings.getAll();
    tableau.extensions.settings.set(
      imageSettingsKey,
      JSON.stringify(selectedImage)
    );

    tableau.extensions.settings.set(
      countSettingsKey,
      JSON.stringify(selectedCount)
    );

    tableau.extensions.settings.set(
      countTextSettingsKey,
      JSON.stringify(selectedCountText)
    );

    tableau.extensions.settings.set(
      percentagesSettingsKey,
      JSON.stringify(selectedPercentages)
    );

    tableau.extensions.settings.saveAsync().then(newSavedSettings => {
      tableau.extensions.ui.closeDialog("config");
    });
  }

  function createButton(buttonTitle) {
    const button = $(`<button type='button' class='btn btn-default btn-block'>
        ${buttonTitle}
      </button>`);
    return button;
  }

  function createImageFieldOptions(buttonTitle) {
    let containerDiv = $("<div />");

    $("<input />", {
      type: "radio",
      id: buttonTitle.index,
      name: "url_field",
      value: buttonTitle.fieldName,
      click: () => {
        updateURL(buttonTitle.index);
      }
    }).appendTo(containerDiv);

    $("<label />", {
      for: buttonTitle.index,
      text: buttonTitle.fieldName
    }).appendTo(containerDiv);

    $("#images").append(containerDiv);
  }

  function createCountFieldOptions(buttonTitle) {
    let containerDiv = $("<div />");

    $("<input />", {
      type: "radio",
      id: buttonTitle.index,
      name: "counter_field",
      value: buttonTitle.fieldName,
      click: () => {
        updateCount(buttonTitle.index);
      }
    }).appendTo(containerDiv);

    $("<label />", {
      for: buttonTitle.index,
      text: buttonTitle.fieldName
    }).appendTo(containerDiv);

    $("#count").append(containerDiv);
  }

  function createCountTextFieldOptions(buttonTitle) {
    let containerDiv = $("<div />");

    $("<input />", {
      type: "radio",
      id: buttonTitle.index,
      name: "counter_text_field",
      value: buttonTitle.fieldName,
      click: () => {
        updateCountText(buttonTitle.index);
      }
    }).appendTo(containerDiv);

    $("<label />", {
      for: buttonTitle.index,
      text: buttonTitle.fieldName
    }).appendTo(containerDiv);

    $("#countText").append(containerDiv);
  }

  function createPercentagesFieldOptions(buttonTitle) {
    let containerDiv = $("<div />");

    $("<input />", {
      type: "radio",
      id: buttonTitle.index,
      name: "percentages_field",
      value: buttonTitle.fieldName,
      click: () => {
        updatePercentages(buttonTitle.index);
      }
    }).appendTo(containerDiv);

    $("<label />", {
      for: buttonTitle.index,
      text: buttonTitle.fieldName
    }).appendTo(containerDiv);

    $("#percentages").append(containerDiv);
  }

  function getSelectedSheet(worksheetName) {
    // go through all the worksheets in the dashboard and find the one we want
    return tableau.extensions.dashboardContent.dashboard.worksheets.find(
      sheet => {
        return sheet.name === worksheetName;
      }
    );
  }
})();
