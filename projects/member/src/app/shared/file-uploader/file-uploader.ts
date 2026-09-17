import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { AppService } from './../../core/http/api.service';
import { anonymousGuard } from '@core/session/auth.guard';
import { Observable, Subject } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'opd-file-uploader',
  imports: [CommonModule],
  templateUrl: './file-uploader.html',
  styleUrl: './file-uploader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FileUploader,
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => FileUploader),
      multi: true,
    },
  ],
})
export class FileUploader implements OnInit, OnChanges, OnDestroy{
  @Input("value") _value: any;
  @Input() multiple: boolean = false;
  @Input() icon_with_text: boolean = false;
  @Input() formatsAllowed: string = ".jpg,.png,.pdf,.docx,.txt,.jpeg,.heic,.heif";
  @Input() maxSize: number = 15;
  @Input() formAction: string = "";
  @Input() config: any = {}; // Remove in future
  @Input() resetUpload: boolean = this.config["resetUpload"];
  @Output() uploadResponse = new EventEmitter();
  @Input() crop_image: boolean = true;
  @Input() compress_image: boolean = false;
  @Input() resource: string = "";
  @Input() datasource: object = {};
  @Input() formSubmit: boolean = false;
  @Input() delete_document: string = "delete";
  @Input() multipleImageUpload: boolean = false;
  @Input() capture_image: boolean = false;
  @Output() focus_out = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() documentInfo = new EventEmitter<any>();
  @Input() question: any;
  @Input() hideViewlink: Boolean = false;
  @Input() compType: any;
  @Input() showinMobile: any = false;
  @Input() listItem: any;
  theme: string = "";
  id: number = 0;
  hideProgressBar: boolean = false;
  uploadAPI: string = "";
  headers: any;
  hideResetBtn: boolean = false;
  hideSelectBtn: boolean = false;
  attachPinText: string = "";
  uploadBtnText: string = "";
  // moment = _moment;
  idDate: number = +new Date();
  reg: RegExp = /(?:\.([^.]+))?$/;
  selectedFiles: Array<any> = [];
  notAllowedList: Array<Object> = [];
  Caption: Array<string> = [];
  singleFile = true;
  progressBarShow = false;
  uploadBtn = false;
  uploadMsg = false;
  afterUpload = false;
  uploadClick = true;
  uploadMsgText: string = ""
  uploadMsgClass: string = ""
  percentComplete: number = 0;
  imageSrc: any;
  imageMimeType: Array<string> = [
    "apng",
    "bmp",
    "ico",
    "cur",
    "jpg",
    "jpeg",
    "jfif",
    "pjpeg",
    "pjp",
    "png",
    "svg",
    "tif",
    "tiff",
    "webp",
    "heic",
    "heif",
  ];
  file: any;
  file_id: any;
  propagateChange = (_: any) => {};
  imageURL = " ";
  docData: any;
  Arr = <any>[];
  result: string = "";
  imageChangedEvent: any = "";
  imageChanges: any;
  croppedImage: boolean = false;
  cropedImage: string = "";
  fileData: any;
  showUploadButton: boolean = false;
  readerFileData: FileReader = new FileReader();
  showmultipleImage: boolean = true;
  hideSelectImageButton: boolean = true;
  fileMimeTypebollean: boolean = false;
  currentMimeType: string = "png";
  // cropDone: ImageCroppedEvent;
  configFile: any = {};
  fileInfo: any = "";
  showCaptureImage: boolean = true;
  cardData: any;
  archive_metadata_check: boolean = false;
  showLabel: any = true;
  jpegUrl: any;
  isOpenDropDown: boolean = false;
  data: any;
  // private isBrowser: boolean;
  private destroy$ = new Subject<void>();
  constructor(
    // @Inject(PLATFORM_ID) platformId: Object,
    // private baseService: BaseService,
    // private appService: AppService,
    // private authenticationService: AuthenticationService,
    // private loader: LoaderService,
    // private alertService: AlertsService,
    // private imageCompress: NgxImageCompressService,
    // private dialogService: DialogService,
    private sanitizer: DomSanitizer,
    // private utilService: UtilService
    private _http: HttpClient,
    private appService: AppService,
    private router: Router
  ) {
    // this.isBrowser = isPlatformBrowser(platformId);
  }

  private async getHeic2any(): Promise<any | null> {
    // if (!this.isBrowser) {
    //   return null;
    // }
    try {
      const mod: any = await import("heic2any");
      return mod.default ?? mod;
    } catch (err) {
      console.error("Failed to dynamically load heic2any in browser:", err);
      return null;
    }
  }

  ngOnChanges(rst: SimpleChanges) {
    this.id =
      this.config["id"] ||
      parseInt((this.idDate / 10000).toString().split(".")[1]) +
        Math.floor(Math.random() * 20) * 10000;
    if (rst["config"]) {
      this.theme = this.config["theme"] || "";
      this.hideProgressBar = this.config["hideProgressBar"] || false;
      this.hideResetBtn = this.config["hideResetBtn"] || false;
      this.hideSelectBtn = this.config["hideSelectBtn"] || false;
      this.uploadBtnText = this.config["uploadBtnText"] || "Upload";
      this.attachPinText = this.config["attachPinText"] || "Attach supporting documents..";
    }
    if (this.formAction == "VIEW") {
      this.hideSelectBtn = true;
      this.showCaptureImage = false;
    }
    if (rst["resetUpload"]) {
      if (rst["resetUpload"].currentValue === true) {
        this.resetFileUpload();
      }
    }
  }

  ngOnInit() {
    console.log("this.compType --");
    console.log(this.compType);
    // if (this.appService.checkNativeApp()) {
    //   if (this.formatsAllowed != "") {
    //     let format = this.formatsAllowed.split(",");
    //     var index = format.indexOf(".dcm");
    //     if (index !== -1) {
    //       format.splice(index, 1);
    //       this.formatsAllowed = format.join(",");
    //     }
    //   }
    // }
    console.log("compress_image", this.compress_image);
    if (this.value != undefined && this.value) {
      this.file_id = this.value;
    }

    if (!this.config) {
      this.config = this.data
    }
    this.resetUpload = false;
    // if (
    //   this.question != undefined &&
    //   this.question &&
    //   this.question.s3Document != undefined &&
    //   this.question.s3Document
    // ) {
    //   this.baseService
    //     .get(
    //       "GET_PAGE",
    //       "",
    //       "archive_metadata",
    //       "system-management",
    //       "adaptor:AMAZONS3,documentType:emrImage"
    //     )
    //     .pipe(takeUntil(this.destroy$))
    //     .subscribe((res_) => {
    //       console.log("Response of archive_metadata : ", res_);
    //       if (res_ && res_.count == 1 && res_.resource && res_.resource.length == 1) {
    //         this.archive_metadata_check = true;
    //       }
    //     });
    // }
  }
  ngAfterViewInit() {
    if (this.file_id != null) this.getfileData();
  }
  resetFileUpload() {
    this.selectedFiles = [];
    this.Caption = [];
    this.notAllowedList = [];
    this.uploadMsg = false;
    this.uploadBtn = false;
  }
  // imageCropped(event: ImageCroppedEvent) {
  //   this.cropedImage = event.base64;
  //   if (this.cropDone == undefined) {
  //     this.cropDone = event;
  //     this.configFile.settleImage = true;
  //   } else {
  //     if (this.cropDone.height != event.height) {
  //       this.configFile.settleImage = false;
  //       this.cropDone = event;
  //     } else if (this.cropDone.width != event.width) {
  //       this.configFile.settleImage = false;
  //       this.cropDone = event;
  //     } else {
  //       this.configFile.settleImage = true;
  //       this.cropDone = event;
  //     }
  //   }
  // }
  opendropdown() {
    this.isOpenDropDown = !this.isOpenDropDown;
  }

  // checkNativeApp() {
  //   if (this.appService.checkNativeApp() || this.utilService.isiOS()) return true;
  //   else return false;
  // }

  // compressFile(image, fileName, reader) {
  //   var sizeOfOriginalImage = this.imageCompress.byteCount(image);
  //   console.log("Size in bytes is now:", sizeOfOriginalImage);
  //   this.imageCompress.compressFile(image, -1, 50, 100).then((result) => {
  //     var sizeOFCompressedImage = this.imageCompress.byteCount(result);
  //     console.log("Size in bytes after compression:", sizeOFCompressedImage);
  //     if (sizeOFCompressedImage > sizeOfOriginalImage) {
  //       // shortcut
  //       this.uploadtoDB(this.dataURLtoFile(image, fileName), fileName, reader);
  //     } else {
  //       this.uploadtoDB(this.dataURLtoFile(result, fileName), fileName, reader);
  //     }
  //   });
  // }

  // crop() {
  //   this.loader.showSpinner();
  //   if (this.configFile.settleImage) {
  //     this.changeImage(this, this.configFile.event, this.file[0] ? this.file[0] : this.fileInfo);
  //   } else {
  //     var reader = new FileReader();
  //     var croppedFile: any = this.dataURLtoFile(this.cropedImage, this.imageChanges.name);
  //     reader.onload = ((file) => {
  //       return (evt) => {
  //         const fileVal = {
  //           file: file,
  //           imageSrc: evt.target.result,
  //         };
  //         // console.log("byte count is 1 :: ", this.imageCompress.byteCount(croppedFile));
  //         // if (this.imageCompress.byteCount(croppedFile) >= 1048576) {
  //         // } 
  //         // else {
  //           this.selectedFiles.push(fileVal);
  //         // }
  //       };
  //     })(croppedFile);
  //     reader.readAsDataURL(croppedFile);
  //     reader.onloadend = () => {
  //       // console.log("byte count is :: ", this.imageCompress.byteCount(croppedFile));
  //       // if (this.imageCompress.byteCount(croppedFile) >= 1048576)
  //       //   // this.compressFile(croppedFile, this.imageChanges.name, reader); // by saurav deep compress file \
  //       // else 
  //         this.uploadContent(croppedFile, this.file[0].name, reader.result);
  //     };
  //   }
  // }

  dataURLtoFile(dataurl: any, filename: any) {
    var arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  imageLoaded() {
    console.log("Show Cropper");
    // show cropper
  }
  cropperReady() {
    console.log("Cropper Ready");
    // cropper ready
  }
  loadImageFailed() {
    console.log("Show Message");
    // show message
  }
  onChange(event: any) {
    this.configFile.event = event;
    try {
      this.fileInfo = event.target.files[0];
    } catch (err) {
      console.log("catch error occured==>", err);
    }
    const that = this;
    this.showCaptureImage = false;
    this.currentMimeType = "png";

    if (event.target.files[0].type != "") {
      this.currentMimeType = event.target.files[0].type.split("/")[1].toLowerCase();
      if (that.imageMimeType.includes(this.currentMimeType)) {
      } else {
        if (that.crop_image) {
          that.fileMimeTypebollean = true;
          that.crop_image = false;
        }
      }
    } else {
      if (that.crop_image) {
        that.fileMimeTypebollean = true;
        that.crop_image = false;
      }
    }

    this.notAllowedList = [];
    if (!this.multipleImageUpload) {
      if (this.afterUpload || !this.multiple) {
        this.selectedFiles = [];
        this.Caption = [];
        this.afterUpload = false;
      }
    }
    //FORMATS ALLOWED LIST
    //NO OF FORMATS ALLOWED
    let formatsCount: any;
    formatsCount = this.formatsAllowed.match(new RegExp("\\.", "g"));
    formatsCount = formatsCount.length;

    //ITERATE SELECTED FILES
    //let file: FileList;
    if (event.type == "drop") {
      this.file = event.dataTransfer.files;
    } else {
      this.file = event.target.files || event.srcElement.files;
    }
    let currentFileExt: any;
    let ext: any;
    let frmtAllowed: boolean;
    for (let i = 0; i < this.file.length; i++) {
      //CHECK FORMAT
      //CURRENT FILE EXTENSION
      currentFileExt = this.reg.exec(this.file[i].name);
      currentFileExt = currentFileExt[1];
      frmtAllowed = false;
      //FORMAT ALLOWED LIST ITERATE
      for (let j = formatsCount; j > 0; j--) {
        ext = this.formatsAllowed.split(".")[j];
        if (j == formatsCount) {
          ext = this.formatsAllowed.split(".")[j] + ",";
        } //check format
        if (currentFileExt.toLowerCase() == ext.split(",")[0]) {
          frmtAllowed = true;
        }
      }

      if (frmtAllowed) {
        //CHECK SIZE
        if (this.file[i].size > this.maxSize * 1024000) {
          this.notAllowedList.push({
            fileName: this.file[i].name,
            fileSize: this.convertSize(this.file[i].size),
            errorMsg: "Invalid size",
          });
          continue;
        } else {
          if (!this.crop_image) {
            this.changeImage(that, event, this.file[i]);
          } else {
            if (!this.multipleImageUpload) {
              if (this.crop_image && !this.multiple) {
                that.croppedImage = false;
                this.imageChangedEvent = event;
                this.imageChanges = this.file[i];
              } else {
                this.changeImage(that, event, this.file[i]);
              }
            } else {
              this.changeImage(that, event, this.file[i]);
            }
          }
        }
      } else {
        // this.uploadBtn = false;
        this.notAllowedList.push({
          fileName: this.file[i].name,
          fileSize: this.convertSize(this.file[i].size),
          errorMsg: "Invalid format",
        });
        continue;
      }
    }
  }

  changeImage(that: any, event: any, file: any) {
    // This is for single file, we need to upgrade for multifile
    //format allowed and size allowed then add file to selectedFile array
    // for (let i = 0; i < file.length; i++) {
    const reader = new FileReader();
    var toRead: any = file;
    var fileAr = toRead.name.split(".");
    var isManualChange = false;
    const input = event.target as HTMLInputElement;
    if (
      input.files &&
      input.files.length &&
      input.files[0].type &&
      (input.files[0].type.endsWith("heic") || input.files[0].type.endsWith("heif"))
    ) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const heic2any = await this.getHeic2any();
          if (!heic2any) {
            console.warn(
              "HEIC/HEIF conversion skipped: heic2any is not available in this environment"
            );
            return;
          }

          const arrayBuffer = reader.result as ArrayBuffer;

          const output = await heic2any({
            blob: new Blob([arrayBuffer], { type: file.type }),
            toType: "image/jpeg",
            quality: 0.9,
          });

          const jpegBlob = Array.isArray(output) ? output[0] : output;
          const jpegFile = new File([jpegBlob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
            type: "image/jpeg",
            lastModified: new Date().getTime(),
          });

          const fileVal = {
            file: jpegFile,
            imageSrc: that.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(jpegBlob)),
          };
          that.selectedFiles.push(fileVal);
          this.uploadContent(jpegFile, jpegFile.name, jpegFile);
        } catch (error) {
          console.error("Conversion error:", error);
        }
      };

      reader.readAsArrayBuffer(file);
      //this.uploadContent(toRead, toRead.name, reader.result);
    } else {
      if (
        (fileAr[1] != undefined && fileAr[1] == "dcm") ||
        (fileAr[2] != undefined && fileAr[2] == "dcm")
      ) {
        toRead = new Blob([toRead], { type: "application/dicom" });
        toRead.name = file.name;
        isManualChange = true;
      }
      if (
        (fileAr[1] != undefined && fileAr[1] == "plist") ||
        (fileAr[2] != undefined && fileAr[2] == "plist")
      ) {
        toRead = new Blob([toRead], { type: "application/x-plist" });
        toRead.name = file.name;
        isManualChange = true;
      }
      if (
        (fileAr[1] != undefined && fileAr[1] == "p8") ||
        (fileAr[2] != undefined && fileAr[2] == "p8")
      ) {
        toRead = new Blob([toRead], { type: "application/x-authkey" });
        toRead.name = file.name;
        isManualChange = true;
      }
      reader.onload = ((file) => {
        return function (evt) {
          console.log("event is :: ", evt, "width is :: ");
          if(evt.target){
          that.fileData = evt.target.result;
          }
          console.log("evt.target : ", that.fileData);
          const fileVal = {
            file: file,
            imageSrc: that.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file)),
          };
          if (
            that.fileData.split(";")[0].split("/")[1] == "dcm" ||
            that.fileData.split(";")[0].split("/")[1] == "dicom" ||
            that.fileData.split(";")[0].split("/")[1] == "pdf" ||
            !that.compress_image
          ) {
            that.selectedFiles.push(fileVal);
          } else if (
            that.imageCompress.byteCount(that.fileData) >= 50 * 1048576 &&
            that.compress_image
          ) {
            console.log(" inside imagecompress..");
          } else {
            that.selectedFiles.push(fileVal);
          }
        };
      })(toRead);
      if (this.config != undefined && this.config.isContent != undefined && this.config.isContent) {
        reader.readAsBinaryString(toRead); //reading raw content
      } else {
        reader.readAsDataURL(toRead);
      }
      reader.onloadend = () => {
        if (this.formSubmit) {
          let fileData = reader.result;
          this.value = fileData;
        } else {
          if (isManualChange) {
            this.uploadContent(toRead, toRead.name, reader.result);
          } else {
            if (!this.multipleImageUpload) {
              if (that.fileData.split(";")[0].split("/")[1] == "pdf" || !that.compress_image)
                this.uploadContent(file, file.name, reader.result); //single file upload
              // else 
              //   this.compressFile(that.fileData, event.target.files[0]["name"], reader); // by saurav deep compress file \
            } else {
              this.readerFileData = reader;
              this.showUploadButton = true;
            }
          }
        }
        that.validateButton(event);
      };
    }
  }

  checkifheic(that: any) {
    try {
      if (
        that.fileData.split(";")[0].split("/")[1] != "heic" &&
        that.fileData.split(";")[0].split("/")[1] != "heif"
      ) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      return true;
    }
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this.file_id = val;
    this.propagateChange(val);
  }

  writeValue(value: any) {
    if (value) {
      this.file_id = value;
    }
  }

  private getValue(item: any, field: any) {
    const name = field.name;
    let value = null;
    value = item[name];
    return value;
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {}

  validateButton(event: any) {
    if (this.selectedFiles.length !== 0) {
      this.uploadBtn = true;
      if (this.theme == "attachPin") {
        this.uploadFiles();
      }
    } else {
      this.uploadBtn = false;
    }
    this.uploadMsg = false;
    this.uploadClick = true;
    this.percentComplete = 0;
    event.target.value = null;
  }

  uploadFiles() {
    this.uploadClick = false;
    this.notAllowedList = [];
    this.uploadBtn = false;
    const isError = false;
    const data = this.selectedFiles[0]["imageSrc"];
    this.selectedFiles.forEach((selectedObj) => {
      const base64 = this.base64(selectedObj.imageSrc);
      selectedObj.base64 = base64;
    });
  }

  removeuploadedFile(i: any, sf_na: any) {
    this.selectedFiles.splice(i, 1);
  }

  removeFile(i: any, sf_na: any) {
    if (this.config != undefined && this.config.isContent != undefined && this.config.isContent) {
      this.selectedFiles.splice(i, 1);
      this.Caption.splice(i, 1);
      this.value = "";
      this.delete.emit({ type: "delete", id: this.id });
      this.showLabel = true;
      return;
    }
    if (this.fileMimeTypebollean) {
      this.crop_image = true;
    }

    if (this.formSubmit) {
      this.selectedFiles.splice(i, 1);
      this.file_id = "";
      this.showCaptureImage = true;
    } else {
      if (sf_na == "sf") {
        // this.loader.showSpinner();
        if (this.multiple) {
          this.deleteImageApi$(this.file_id[i].documentId)
            // .pipe(takeUntil(this.destroy$))
            .subscribe((res: any) => {
              if (res) {
                // this.delete.emit({ type: "delete", id: this.file_id[i].documentId });
                // this.showLabel = true;
                // this.file_id.splice(i, 1);
                // this.selectedFiles.splice(i, 1);
                // this.Caption.splice(i, 1);
                // this.value = this.file_id;
                // if (this.crop_image) {
                //   this.imageChangedEvent = "";
                //   this.croppedImage = false;
                //   this.cropedImage = "";
                //   document.getElementById("sel" + this.id)["value"] = "";
                // }
                // this.alertService.success(res.message);
                // this.showCaptureImage = true;
                // this.loader.hideSpinner();
              }
            });
        } else {
          if (this.config != undefined && this.config.hideDeleteAPI) {
            this.deleteImage(i);
          } else {
            this.deleteImageApi$(this.file_id)
              // .pipe(takeUntil(this.destroy$))
              .subscribe((res: any) => {
                if (res) {
                  // this.alertService.success(res.message);
                  this.deleteImage(i);
                  if (!this.multipleImageUpload) {
                    this.focus_out.emit(null);
                  }
                }
              });
          }
        }
      } else {
        this.notAllowedList.splice(i, 1);
      }
    }

    if (this.selectedFiles.length == 0) {
      this.uploadBtn = false;
    }
    // this.loader.hideSpinner();
  }

  deleteImage(i: any) {
    if (this.multipleImageUpload) {
      this.selectedFiles = [];
    } else {
      this.selectedFiles.splice(i, 1);
    }
    this.Caption.splice(i, 1);
    this.value = "";
    // this.loader.hideSpinner();
    if (this.crop_image) {
      this.imageChangedEvent = "";
      this.croppedImage = false;
      this.cropedImage = "";
      (document.getElementById("sel" + this.id)! as HTMLInputElement).value = '';
    }
    this.showCaptureImage = true;
    this.delete.emit({ type: "delete", id: this.id });
    this.showLabel = true;
  }

  convertSize(fileSize: number) {
    return fileSize < 1024000
      ? (fileSize / 1024).toFixed(2) + " KB"
      : (fileSize / 1024000).toFixed(2) + " MB";
  }

  attachpinOnclick() {
    document.getElementById("sel" + this.id)!.click();
  }

  // clickImage() {
  //   let obj = { data: {}, title: "Photos", size: DialogModalSize.Md, className: "modal-m" };
  //   this.dialogService
  //     .open(ClickPhotoComponent, obj)
  //     .afterClosed.pipe(takeUntil(this.destroy$))
  //     .subscribe((response) => {
  //       if (response) {
  //         response["name"] = "kx-image-" + this.moment().valueOf() + ".jpeg";
  //         response["lastModified"] = this.moment().valueOf();
  //         response["webkitRelativePath"] = "";
  //         response["lastModifiedDate"] = this.moment();
  //         var p = [];
  //         p.push(response);
  //         this.onChange({ "target": { files: p } });
  //         this.showCaptureImage = false;
  //       }
  //     });
  // }

  drop(event: any) {
    event.stopPropagation();
    event.preventDefault();
    this.onChange(event);
  }

  allowDrop(event: any) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  base64(imageSrc: any) {
    return imageSrc.substring(imageSrc.indexOf(",") + 1, imageSrc.length);
  }
  uploadtoDB(file: any, name: any, reader: any) {
    console.log("file is :: ", file);
    reader.onload = ((file) => {
      return (evt: any) => {
        const fileVal = {
          file: file,
          imageSrc: evt.target.result,
        };
        if (this.selectedFiles.length === 0) {
          this.selectedFiles.push(fileVal);
        }
      };
    })(event);
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      this.uploadContent(file, name, reader.result);
    };
  }

  uploadContent(content: File, fileName: string, fileContent? :any) {
    if (this.config != undefined && this.config.isContent != undefined && this.config.isContent) {
      if (this.config.contentBase64 != undefined && this.config.contentBase64) {
        this.value = btoa(fileContent);
      } else {
        this.value = fileContent;
      }

      this.documentInfo.emit({ fileInfo: this.fileInfo, data: {} });
      this.focus_out.emit(this.value);
      this.showLabel = false;
    } else {
      // this.loader.showSpinner();
      const formData = new FormData();
      formData.append("file", content);
      formData.append("fileName", fileName);
      formData.append("action", "add");
      let userId: string = "";
      // var currentOrg = this.appService.getOrganization();
      // var currentUser = this.authenticationService.getCurrentUser();
      // if (this.resource == "orgImage" && currentOrg != undefined) {
      //   userId = currentOrg.org_id;
      // } else if (this.resource == "userImage" && currentUser != undefined) {
      //   userId = currentUser.id; //TODO:verify if its correct user id
      // }
      formData.append("userId", userId);
      let documentResource = this.resource;
      let application = "dms";
      // const formData = new FormData();
      // const reader = new FileReader();
      // formData.append("file", file);
      // formData.append("fileName", fileName);
      // formData.append("action", action);
      this.uploadOPDDocument(formData, fileContent)
      // this.baseService
      //   .upload(formData, application, documentResource, fileContent)
      //   .pipe(takeUntil(this.destroy$))
      //   .subscribe(
      //     (data: any) => {
      //       if (data.errCode != -1) {
      //         this.croppedImage = true;
      //         this.showCaptureImage = true;
      //         if (this.multiple) {
      //           var p = { documentId: data.documentId };
      //           this.Arr.push(p);
      //           if (this.value != undefined && typeof this.value == "object" && this.value != 0)
      //             this.value.push(this.Arr[this.Arr.length - 1]);
      //           else this.value = this.Arr;
      //           if (this.value) {
      //             this.focus_out.emit(this.value);
      //             this.showLabel = false;
      //           } else {
      //             this.focus_out.emit(data);
      //             this.showLabel = false;
      //           }
      //         } else {
      //           this.value = data.documentId;
      //           this.documentInfo.emit({ fileInfo: this.fileInfo, data: data });
      //           if (this.value) {
      //             this.focus_out.emit(data.documentId); // Need to re-check
      //             this.showLabel = false;
      //           } else {
      //             this.focus_out.emit(data);
      //             this.showLabel = false;
      //           }
      //         }
      //       } else {
      //         this.resetFileUpload();
      //         this.alertService.error(data.message);
      //       }
      //       this.loader.hideSpinner();
      //     },
      //     (error) => {
      //       console.log(error);
      //       this.resetFileUpload();
      //       this.alertService.error(error);
      //       this.loader.hideSpinner();
      //     }
      //   );
    }
  }
uploadOPDDocument(formData: any, fileContent: any){
    const url = "/dms/api/v1/emrImage";
    
    var encrypted = this.appService.getXsrfToken(fileContent, true);
    return this._http.post(url, formData, {
            headers: new HttpHeaders().set('X-XSRF-TOKEN', encrypted).set('timezone', this.appService.getUserTimezone()).set('current_time', this.appService.getCurrentTime()).set('current_url', this.router.url)
                .set('host_name', window.location.host),
            responseType: 'json',
            observe: 'response' as 'response'
        }).subscribe((res : any )=> {
          if(res?.errCode != 0){
          //   this.afterUploadSelectedDocumentDetails.push(
          //     {
          //     "name": res?.resource[0]?.file_name,
          //     "document_id": res?.resource[0]?.document_id,
          //     "document_type":  kind === 'bill' ? "INVOICE" : kind === 'prescription' ? 'PRESCRIPTION' : kind === 'report' ? 'REPORT' : kind === 'other' ? 'OTHER' : 'OTHER',
          //     "originalname": res?.resource[0]?.file_name,
          //     "verification_status": "PENDING",
          //     "filetype": fileDetails?.type,
          //     "filesize": fileDetails?.size,
          // });
          // this.setFiles(kind, [...this.filesFor(kind), ...chosen.filter((file: any) => file.size <= MAX_BYTES)]);
          }
        })
  }
  getfileData() {
    let userId: string = "";
    // var currentOrg = this.appService.getOrganization();
    // var currentUser = this.authenticationService.getCurrentUser();
    // if (this.resource == "orgImage" && currentOrg != undefined) {
    //   userId = currentOrg.org_id;
    // } else if (this.resource == "userImage" && currentUser != undefined) {
    //   userId = currentUser.id; //TODO:verify if its correct user id
    // }
    let documentResource = this.resource + "/image-response-entity";
    if (Array.isArray(this.file_id)) {
      for (let i = 0; i < this.file_id.length; i++) {
        // let url = this.baseService.get_url(
        //   "",
        //   "id:" + this.file_id[i].documentId,
        //   documentResource,
        //   "dms"
        // );
        // this.getImageData(url);
      }
    } else {
      // let url = this.baseService.get_url("", "id:" + this.file_id, documentResource, "dms");
      // this.getImageData(url);
    }
  }
  // getImageData(url) {
  //   this.baseService
  //     .getFileByUrlWithHeader(url, false)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe((res) => {
  //       console.log("file res", res);
  //       let filename = res.headers.get("filename");
  //       res = res.body;
  //       let file = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(res));
  //       this.selectedFiles.push({
  //         imageSrc: file,
  //         file: {
  //           name: res.documentName ? res.documentName : filename ? filename : "",
  //           size: res.size,
  //           type: res.type,
  //           blob: res,
  //         },
  //       });
  //     });
  // }
  deleteImageApi$(data: any): any {
    let documentResource = this.resource;
    let application = "dms";
    const formData = new FormData();
    formData.append("id", data);
    formData.append("action", this.delete_document);
    formData.append("fileName", "");
    var key = btoa(data);
    return ;
    // return this.baseService.upload(formData, application, documentResource, key);
  }

  saveByteArray(reportName: any, byte : any) {
    var blob = new Blob([byte], { type: "application/pdf" });
    var link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    var fileName = reportName;
    link.download = fileName;
    link.click();
  }

  showImage(file: any) {
    if (file.file && file.file.type == "load") return true;
    else if (file.file && this.imageMimeType.includes(file.file.type.split("/")[1].toLowerCase()))
      return true;
    else return false;
  }
  // openPdf(file) {
  //   console.log("File is ", file);
  //   if (file.file.type == "application/pdf") {
  //     let blob = this.sanitizer.sanitize(4, file.imageSrc);
  //     let obj = {
  //       data: { "url": blob, "blob": blob, isBlob: true },
  //       title: "View Pdf",
  //       size: DialogModalSize.Lg,
  //     };
  //     this.dialogService
  //       .open(PdfViewerComponent, obj)
  //       .afterClosed.pipe(takeUntil(this.destroy$))
  //       .subscribe((response) => {});
  //   }
  //   if (file.file.type == "text/plain") {
  //     var link = document.createElement("a");
  //     let blob = this.sanitizer.sanitize(4, file.imageSrc);
  //     link.href = blob;
  //     link.download = file.file.name;
  //     link.click();
  //   }
  // }

  // viewImage(i, sf: any) {
  //   let obj = {
  //     data: {
  //       "documentId":
  //         this.file_id[i].documentId == undefined ? this.file_id : this.file_id[i].documentId,
  //       resource:
  //         this.datasource["resource"] != undefined ? this.datasource["resource"] : this.resource,
  //       contentType: sf.file.type,
  //     },
  //     title: "View Image",
  //     size: DialogModalSize.Lg,
  //   };
  //   this.dialogService
  //     .open(ShowPdfComponent, obj)
  //     .afterClosed.pipe(takeUntil(this.destroy$))
  //     .subscribe((response) => {});
  // }

  clearInput(id: any) {
    this.showCaptureImage = true;
    this.configFile.event = null;
    (document.getElementById(id)! as HTMLInputElement).value = '';
    // document.getElementById(id)["value"] = "";
  }
  validate(value: FormControl) {}

  convertToJpeg() {
    //reader.readAsArrayBuffer(this.selectedFile);
  }

  // isMobile() {
  //   return this.utilService.isMobile();
  // }

  // setDataForS3(formData, data) {
  //   try {
  //     if (data.uniqueFile == "") {
  //       // for setting different image in same file name
  //       data.uniqueFile = false;
  //     }
  //     let payload = JSON.stringify(data);
  //     formData.append("resource", payload);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
