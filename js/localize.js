// Declare async functions at the top level
async function makeAjaxCall(id, block) {
  try {
    let response = await fetch(`/localized/${id}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      let data = await response.text();
      console.log('AJAX call for localized block successful');

      // Logic for 2 column block.
      if (data.includes('take-action')) {
        block.outerHTML = data;
      } else {
        // Replace the parent element of the block with the returned HTML
        let parentElement = block.parentElement;
        let newElement = document.createElement('div');
        newElement.classList.add('localized');
        newElement.innerHTML = data;

        // Replace the parent element with the new content
        parentElement.replaceWith(newElement.firstElementChild);
      }

      // Call function to set bg image. That could be moved out of main.js in the future.
      setBgImage();
    } else {
      console.error('Network response was not ok.');
    }
  } catch (error) {
    console.error('Fetch operation failed:', error);
  }
}

async function getUserIP() {
  try {
    let response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      let data = await response.json();
      console.info('IP address is: ' + data.ip);
      // Call the Drupal route with the IP address and return the state code
      return await getStateCode(data.ip);
    } else {
      console.error('Network response was not ok.');
      return null;
    }
  } catch (error) {
    console.error('Fetch operation failed:', error);
    return null;
  }
}

async function getStateCode(ip) {
  try {
    // Use the test IP if it's passed in the URL.
    const urlParams = new URLSearchParams(window.location.search);
    const ipToUse = urlParams.get('test_ip') || ip;

    let response = await fetch(`/ip-lookup/${ipToUse}`);
    if (response.ok) {
      let data = await response.json();
      return data.state_code;
    } else {
      console.error('Localization failed. Network response was not ok.');
      return null;
    }
  } catch (error) {
    console.error('Localization failed:', error);
    return null;
  }
}

// Main logic to handle localized blocks
const localizedBlocks = document.querySelectorAll('.localized');
if (localizedBlocks.length > 0) {
  // Get the user's state code once and use it for all blocks
  getUserIP().then(stateCode => {
    if (stateCode) {
      localizedBlocks.forEach(block => {
        let locations = block.getAttribute('data-localized-locations').split(' ');
        let localizationDone = false;
        for (let location of locations) {
          let [state, id] = location.split(':');
          if (state === stateCode) {
            // If the state matches the stateCode, make the Ajax call with the extracted id.
            makeAjaxCall(id, block);
            localizationDone = true;
            break;
          }
        }
        if (!localizationDone) {
          // There is not localized version of this block, fade it in.
          block.classList.add('localized-loaded');
        }
      });
    } else {
      console.error('State code could not be determined.');
      localizedBlocks.forEach(block => {
        // Handle failure by loading the base block.
        block.classList.add('localized-loaded');
      });
    }
  });
}
