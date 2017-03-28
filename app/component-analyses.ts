import { ApiLocator } from './index';

export class ComponentAnalyses {

    private stackApiUrl: string;
    private api: ApiLocator = new ApiLocator();

    constructor() {
        this.stackApiUrl = this
            .api
            .buildApiUrl(STACK_API_URL, 'recommender.api', 'api/v1');
    }

    buildComponentGrid = (dataSet: Array<any>) => {
        $('#compTable tbody').empty();
        for (var i in dataSet) {
            var strToAdd = '<tr>' +
                '<td>' + dataSet[i].ecosystem + '</td>' +
                '<td>' + dataSet[i].name + '</td>' +
                '<td>' + dataSet[i].cyclomaticComplexity + '</td>' +
                '<td>' + dataSet[i].lineOfCode + '</td>' +
                '<td>' + dataSet[i].numOfFiles + '</td>' +
                '<td>' + dataSet[i].dependentsCount + '</td>' +
                '<td>' + dataSet[i].currentVersion + '</td>' +
                '<td>' + dataSet[i].latestVersion + '</td></tr>';
            $('#compTable tbody').append(strToAdd);
        }
    }

    formStackData = (compAnalysesArray: any) => {
        if (compAnalysesArray.hasOwnProperty('version') && compAnalysesArray.hasOwnProperty('package')) {
            let dataSet: Array<any> = [];
            let dataSetObj: any = {};
            dataSetObj.ecosystem = compAnalysesArray.version.pecosystem[0];
            dataSetObj.name = compAnalysesArray.version.pname[0];
            dataSetObj.cyclomaticComplexity = compAnalysesArray.version.cm_avg_cyclomatic_complexity[0];
            dataSetObj.lineOfCode = compAnalysesArray.version.cm_loc[0];
            dataSetObj.numOfFiles = compAnalysesArray.version.cm_num_files[0];
            dataSetObj.dependentsCount = compAnalysesArray.version.dependents_count[0];
            dataSetObj.currentVersion = compAnalysesArray.version.version[0];
            dataSetObj.latestVersion = compAnalysesArray.package.latest_version[0];
            dataSet.push(dataSetObj);
            this.buildComponentGrid(dataSet);
        }
    }

    buildComponentAnalyses = () => {
        let stackUri = this.stackApiUrl;
        let compAnalysesArray: Array<any>;
        let ecosystem: string = '';
        let component: string = '';
        let version: string = '';
        $('#compGridCntr').hide();
        $('#componentStatus').hide();
        $("#componentanalysesform").submit((val: any) => {
            ecosystem = $("#ecosystem").val();
            component = $("#component").val();
            version = $("#version").val();
            $.ajax({
                url: stackUri + 'component-analyses/' + ecosystem + '/' + component + '/' + version,
                headers: {
                    'Content-Type': "application/json"
                },
                method: 'GET',
                success: response => {
                    if (response && response.result && response.result.data) {
                        compAnalysesArray = response.result.data;
                        $('#compGridCntr').show();
                        $('#componentStatus').hide();
                        this.formStackData(compAnalysesArray);
                    } else {
                        $('#compGridCntr').hide();
                        $('#componentStatus').show();
                        $('#componentStatusMsg').text('No records found');
                    }
                },
                error: () => {
                    $('#compGridCntr').hide();
                    $('#componentStatus').show();
                    $('#componentStatusMsg').text('Failed to fetch the records');
                }
            });
            event.preventDefault();
        });
    }

}