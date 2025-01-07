$(document).ready(function () {
    // Load existing members from JSON
    function loadExistingMembers() {
        $.ajax({
            url: '/static/members.json', // Path to the JSON file
            method: 'GET',
            success: function (members) {
                const memberList = $('#existingMembers');
                const signerDropdown = $('#signerDropdown');

                memberList.empty(); // Clear existing content
                signerDropdown.empty(); // Clear existing dropdown options

                members.forEach(member => {
                    // Populate the members list
                    memberList.append(`
                        <li class="list-group-item">
                            <input type="checkbox" class="form-check-input member-checkbox"
                                   data-name="${member.name}"
                                   data-nip="${member.nip}"
                                   data-pangkat="${member.pangkat}"
                                   data-jabatan="${member.jabatan}"
                                   data-organization="${member.organization}">
                            <strong>${member.name}</strong> - ${member.nip}
                        </li>
                    `);

                    // Populate the signer dropdown
                    signerDropdown.append(`
                        <option value="${member.nip}"
                                data-name="${member.name}"
                                data-nip="${member.nip}"
                                data-pangkat="${member.pangkat}"
                                data-jabatan="${member.jabatan}"
                                data-organization="${member.organization}">
                            ${member.name}
                        </option>
                    `);
                });
            },
            error: function (error) {
                console.error('Error loading members:', error);
            }
        });
    }

    // Call the function to load existing members on page load
    loadExistingMembers();

    // Search Member Logic
    $('#searchForm').on('submit', function (e) {
        e.preventDefault(); // Prevent default form submission
        const query = $('#query').val().toLowerCase(); // Get the search query

        // Send the search request to the backend
        $.ajax({
            url: `/search_member?query=${query}`,
            method: 'GET',
            success: function (results) {
                if (results.length === 0) {
                    alert('No members found for the search query.');
                    return;
                }

                // Populate the search results modal
                const resultListPopup = $('#searchResultsPopup');
                resultListPopup.empty(); // Clear previous results
                results.forEach(member => {
                    resultListPopup.append(`
                        <li class="list-group-item">
                            <input type="checkbox" class="form-check-input add-member-checkbox" 
                                   data-name="${member.name}" 
                                   data-nip="${member.nip}" 
                                   data-pangkat="${member.pangkat}" 
                                   data-jabatan="${member.jabatan}" 
                                   data-organization="${member.organization}">
                            <strong>${member.name}</strong> - ${member.nip}
                        </li>
                    `);
                });

                // Show the modal
                const modal = new bootstrap.Modal(document.getElementById('searchModal'));
                modal.show();
            },
            error: function (xhr, status, error) {
                console.error('Error during search:', error);
                alert('An error occurred while searching. Please try again.');
            }
        });
    });    

    // Add Selected Members from Search Results
    $('#addSelectedMembers').on('click', function () {
        const selectedMembers = [];
        $('.add-member-checkbox:checked').each(function () {
            selectedMembers.push({
                name: $(this).data('name'),
                nip: $(this).data('nip'),
                pangkat: $(this).data('pangkat'),
                jabatan: $(this).data('jabatan'),
                organization: $(this).data('organization')
            });
        });

        selectedMembers.forEach(member => {
            // Dynamically add to the "Existing Members" list
            $('#existingMembers').append(`
                <li class="list-group-item">
                    <input type="checkbox" class="form-check-input member-checkbox"
                           data-name="${member.name}"
                           data-nip="${member.nip}"
                           data-pangkat="${member.pangkat}"
                           data-jabatan="${member.jabatan}"
                           data-organization="${member.organization}">
                    <strong>${member.name}</strong> - ${member.nip}
                </li>
            `);

            // Dynamically add to the signer dropdown
            $('#signerDropdown').append(`
                <option value="${member.nip}"
                        data-name="${member.name}"
                        data-nip="${member.nip}"
                        data-pangkat="${member.pangkat}"
                        data-jabatan="${member.jabatan}"
                        data-organization="${member.organization}">
                    ${member.name}
                </option>
            `);
        });

        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('searchModal'));
        modal.hide();
    });

    // Generate Document Logic
    $('#generateForm').on('submit', function (e) {
        e.preventDefault(); // Prevent default form submission
    
        // Collect members
        const selectedMembers = [];
        $('.member-checkbox:checked').each(function () {
            selectedMembers.push({
                name: $(this).data('name'),
                nip: $(this).data('nip'),
                pangkat: $(this).data('pangkat'),
                jabatan: $(this).data('jabatan'),
                organization: $(this).data('organization')
            });
        });
    
        // Collect signer
        const selectedSigner = $('#signerDropdown option:selected');
        const signer = {
            name: selectedSigner.data('name'),
            nip: selectedSigner.data('nip'),
            pangkat: selectedSigner.data('pangkat'),
            jabatan: selectedSigner.data('jabatan') === "Direktur Seismologi Teknik Geofisika Potensial dan Tanda Waktu"
                ? "Direktur Seismologi Teknik Geofisika Potensial dan Tanda Waktu"
                : "Plh. Direktur Seismologi Teknik Geofisika Potensial dan Tanda Waktu",
            organization: selectedSigner.data('organization')
        };
        //format date 
        // Function to format date from YYYY-MM-DD to DD MM YYYY
        function formatDate(dateString) {
            const date = new Date(dateString);
            const months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];
        
            const day = String(date.getDate()).padStart(2, '0');
            const month = months[date.getMonth()];
            const year = date.getFullYear();
        
            return `${day} ${month} ${year}`;
        }
        const rawDate = $('#tanggalBerangkat').val(); // Returns YYYY-MM-DD
        const formattedDate = formatDate(rawDate); // Converts to DD MM YYYY

        // Collect task details
        const taskDetails = {
            tugas: $('#tugas').val(),
            lama_perjalanan: $('#lamaPerjalanan').val(),
            lokasi: $('#lokasi').val(),
            tanggal_berangkat: formattedDate,
            sumber_dana: $('#sumberDana').val()
        };
    
        // Combine data into a single object
        const data = {
            members: selectedMembers,
            signer: signer,
            task_details: taskDetails
        };
    
        // Send the data to the server via AJAX
        $.ajax({
            url: '/generate_st',
            method: 'POST',
            contentType: 'application/json', 
            data: JSON.stringify(data),
            success: function () {
                // On success, trigger file download
                window.location.href = '/download_st'; // Send a GET request to download the file
            },
            error: function (xhr, status, error) {
                console.error('Error during document generation:', error);
                alert('An error occurred while generating the document. Please try again.');
            }
        });
    });
});